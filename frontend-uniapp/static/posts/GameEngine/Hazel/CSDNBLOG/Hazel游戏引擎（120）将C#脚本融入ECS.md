> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为实现C#脚本WSAD能控制实体的位置变化

- 如何实现

  使用118节C++内部调用C#的函数功能，实现C++调用C#脚本的OnCreate、OnUpdate函数的调用。

  使用119节C#内部调用C++的函数功能，实现C#的WSAD能调用C++函数修改实体的位置。

# 实现此节目的思路

## C#调用C++的函数

- C#中写好**声明**要调用C++函数

  - 根据UUID**获取**实体位置
  - 根据UUID**设置**实体位置
  - WSAD按键是否按下

- C++中**定义**好（C#中声明的）外部调用的函数

  - 当前场景根据UUID获取到实体**得到**它的位置，通过指针返回给C#
  - 当前场景根据UUID获取到实体**设置**它的位置
  - 调用系统已经实现的事件系统判断WSAD按键是否按下

- C#的OnUpdate函数

  每帧获取实体的当前位置，检测根据WASD事件改变实体的位置，把新位置传给C++

## C++调用C#的函数

### 给出名词解释

```cpp
struct ScriptEngineData {
    ....
    ScriptClass EntityClass;		// 存储C#父类Entity的Mono类
	// 所有C#脚本map (脚本map)		，存储封装的Mono类
    std::unordered_map<std::string, Ref<ScriptClass>> EntityClasses;
    // 需要运行的C#脚本map（运行脚本map），存储封装的Mono类对象
    std::unordered_map<UUID, Ref<ScriptInstance>> EntityInstances;	
    ....
};
```

- ScriptEngine类

  封装 加载构建Mono环境类

- ScriptClass类

  封装 加载C#类成Mono类 的类

- ScriptInstance类

  封装 由Mono类**实例化**的Mono类**对象**

### 具体步骤

- 找到dll里所有继承Entity的类，表明这是**脚本类**，得到对应的封装的Mono类（119封装的）

- 用**脚本map**存储所有**封装的**mono类

- 在运行场景开始时

  1. 循环遍历当前所有具有**脚本组件**的实体

  2. 用**运行脚本map**存储这些**封装的**mono类**对象**（用封装的Mono类实例化）

     （key是实体的UUID）

  3. 调用C#类的OnCreate函数，**存储**OnCreate、OnUpdate函数

  4. C++调用C#父类Entity的构造函数传入当前实体的**UUID**给C#

     C#脚本有UUID后，**C#的一个脚本**才能 与 拥有这个C#脚本的**C++实体**联系在一起

- 在运行场景的update函数

  循环遍历当前所有具有脚本组件的实体，根据UUID在**运行脚本map**找到这个**封装的**mono类**对象**，并调用C#类的OnUpdate函数

## 总结复习C++调用C#函数Mono的步骤（118节）

有利于理解本节重点的代码

0. 初始化Mono准备，需得到MonoDomain、MonoAssembly、MonoImage

   ```cpp
   // 0.1设置程序集装配路径(复制的4.5版本的路径)
   mono_set_assemblies_path("mono/lib");
   // 0.2声明根域
   MonoDomain* rootDomian = mono_jit_init("HazelJITRuntime");
   // 存储root domain指针
   s_Data->RootDomain = rootDomian;
   // 0.3创建一个应用 domain
   s_Data->AppDomain = mono_domain_create_appdomain("HazelScriptRuntime", nullptr);
   mono_domain_set(s_Data->AppDomain, true);
   // 0.4加载c#项目导出的dll程序集
   s_Data->CoreAssembly = LoadCSharpAssembly("Resources/Scripts/GameEngine-ScriptCore.dll");
   // 0.5得到MonoImage对象
   MonoImage* assemblyImage = mono_assembly_get_image(s_Data->CoreAssembly);
   ```

1. 根据命名空间、类名、MonoImage得到加载C#的**Mono类**=>可以理解为**创建类Class**

   ```cpp
   MonoClass* monoClass = mono_class_from_name(assemblyImage, "Hazel", "Main");
   ```

2. 根据MonoClass和当前应用domain得到**MonoObject**=>可以理解为**Class cls = new Class()得到类的实例**，会调用类的构造函数

   ```cpp
   MonoObject* instance = mono_object_new(s_Data->AppDomain, monoClass);
   mono_runtime_object_init(instance);// 这里初始化会调用C#类的构造函数
   ```

3. 根据MonoClass获取这个类的函数，根据MonoObject和函数名称调用函数=>可以理解为**cls.Func()；**调用类的函数

   ```cpp
   // 3.1根据MonoClass获取这个类的函数
   MonoMethod* printMessageFunc = mono_class_get_method_from_name(monoClass, "PrintMessage", 0);
   // 3.2根据MonoObject和函数名称调用函数
   mono_runtime_invoke(printMessageFunc, instance, nullptr, nullptr);
   ```

# 代码思路+相关代码

## 代码思路

### C#调用C++的函数

比较简单，只需要列出相关的C#代码就能理解

- Entity父类

  ```c#
  using System;
  using System.Runtime.CompilerServices;
  namespace Hazel
  {
      public class Entity
      {
          public readonly ulong ID;   // 实体的UUID
          protected Entity() { Console.WriteLine("Entity()"); ID = 0; }
          internal Entity(ulong id)
          {
              Console.WriteLine("Entity(ulong id)"); ID = id; }// C++通过构造函数传入实体的UUID
  
          public Vector3 Translation {
              get
              {
                  // Translation get访问器 是调用C++的内部函数 获取 实体的位置
                  InternalCalls.TransformComponent_GetTranslation(ID, out Vector3 result);
                  return result;
              }
              set
              {
                  // Translation set访问器 是调用C++的内部函数 设置 实体的位置
                  InternalCalls.TransformComponent_SetTranslation(ID, ref value);
              } 
          }
      }
  }
  ```

- 脚本类

  ```c#
  using System;
  using Hazel;
  namespace Sandbox{
      public class Player : Entity {
          public Player(){
              Console.WriteLine("Player()");
          }
          void OnCreate(){
              Console.WriteLine($"Player.OnCreate() - {ID}");
          }
          void OnUpdate(float ts){
              //Console.WriteLine($"Player.OnUpdate() - {ts}");
              float speed = 1.0f;
              Vector3 velocity = Vector3.Zero;
  			//////////////////////////////////////////
              // 内部调用函数，事件是否触发//////////////////////////////////////////
              if (Input.IsKeyDown(KeyCode.W)){
                  velocity.Y = 1.0f;
              }
              else if (Input.IsKeyDown(KeyCode.S)){
                  velocity.Y = -1.0f;
              }
              else if (Input.IsKeyDown(KeyCode.A)){
                  velocity.X = -1.0f;
              }
              else if (Input.IsKeyDown(KeyCode.D)){
                  velocity.X = 1.0f;
                  Console.WriteLine("press the D key");
              }
              velocity *= speed;
              ////////////////////////////////////////////////////////////
              ////////////////////////////////////////////////////////////
              // Translation get访问器 是调用C++的内部函数 获取 实体的位置
              Vector3 translation = Translation; 
              translation += velocity * ts;
              // Translation set访问器 是调用C++的内部函数 设置 实体的位置
              Translation = translation;          
          }
      }
  }
  ```

- C#声明调用C++内部函数

  ```c#
  using System;
  using System.Runtime.CompilerServices;
  namespace Hazel{
      public static class InternalCalls{
          [MethodImplAttribute(MethodImplOptions.InternalCall)]
          internal extern static bool Input_IsKeyDown(KeyCode keycode);
          [MethodImplAttribute(MethodImplOptions.InternalCall)]
          internal extern static void TransformComponent_GetTranslation(ulong entityID, out Vector3 translation);
          [MethodImplAttribute(MethodImplOptions.InternalCall)]
          internal extern static void TransformComponent_SetTranslation(ulong entityID, ref Vector3 translation);
      }
  }
  namespace Hazel{
      public class Input {
          public static bool IsKeyDown(KeyCode keyCode) {
              return InternalCalls.Input_IsKeyDown(keyCode);
          }
      }
  }
  ```

  对应的C++的内部函数

  ```cpp
  static void TransformComponent_GetTranslation(UUID entityID, glm::vec3* outTranslation) {
      Scene* scene = ScriptEngine::GetSceneContext();// 获取场景
      HZ_CORE_ASSERT(scene);
      Entity entity = scene->GetEntityByUUID(entityID); // 根据C#传入的UUID得到Entity
      HZ_CORE_ASSERT(entity);
  
      *outTranslation = entity.GetComponent<TransformComponent>().Translation;// 返回 Entity的位置
  }
  static void TransformComponent_SetTranslation(UUID entityID, glm::vec3* translation) {
      Scene* scene = ScriptEngine::GetSceneContext();	// 获取场景
      HZ_CORE_ASSERT(scene);
      Entity entity = scene->GetEntityByUUID(entityID);// 根据C#传入的UUID得到Entity
      HZ_CORE_ASSERT(entity);
  
      entity.GetComponent<TransformComponent>().Translation = *translation;// 设置 Entity的位置
  }
  // 判断按键是否按下
  static bool Input_IsKeyDown(KeyCode keycode) {
      return Input::IsKeyPressed(keycode);
  }
  ```

### C++调用C#的函数(C++项目的代码)

- 找到dll里所有继承Entity的类，表明这是**脚本类**，得到对应的封装的Mono类（119封装的）

  并用**脚本map**存储所有**封装的**mono类（用封装的Mono类实例化）

  ```cpp
  void ScriptEngine::LoadAssemblyClasses(MonoAssembly* assembly)
  {
      s_Data->EntityClasses.clear();
  
      MonoImage* image = mono_assembly_get_image(assembly);
      const MonoTableInfo* typeDefinitionsTable = mono_image_get_table_info(image, MONO_TABLE_TYPEDEF);
      int32_t numTypes = mono_table_info_get_rows(typeDefinitionsTable);
      // 1.加载Entity父类
      MonoClass* entityClass = mono_class_from_name(image, "Hazel", "Entity");
  
      for (int32_t i = 0; i < numTypes; i++)
      {
          uint32_t cols[MONO_TYPEDEF_SIZE];
          mono_metadata_decode_row(typeDefinitionsTable, i, cols, MONO_TYPEDEF_SIZE);
  
          const char* nameSpace = mono_metadata_string_heap(image, cols[MONO_TYPEDEF_NAMESPACE]);
          const char* name = mono_metadata_string_heap(image, cols[MONO_TYPEDEF_NAME]);
          std::string fullName;
          if (strlen(nameSpace) != 0) {
              fullName = fmt::format("{}.{}", nameSpace, name);
          }
          else {
              fullName = name;
          }
          // 2.加载Dll中所有C#类
          MonoClass* monoClass = mono_class_from_name(image, nameSpace, name);
          if (monoClass == entityClass) {// entity父类不保存
              continue;
          }
          // 3.判断当前类是否为Entity的子类
          bool isEntity = mono_class_is_subclass_of(monoClass, entityClass, false); // 这个c#类是否为entity的子类
          if (isEntity) {
              // 存入封装的Mono类对象
              // 3.1是就存入脚本map中
              s_Data->EntityClasses[fullName] = CreateRef<ScriptClass>(nameSpace, name);
          }
      }
  }
  ```

- 在运行场景开始前**时**，循环遍历当前所有**具有脚本组件**的实体

  ```cpp
  void Scene::OnRuntimeStart()
  {
      OnPhysics2DStart();
      {// 脚本
          ScriptEngine::OnRuntimeStart(this);
          
          auto view = m_Registry.view<ScriptComponent>();
          for (auto e : view) {
              Entity entity = { e, this };
              ScriptEngine::OnCreateEntity(entity);// 实例化实体拥有的C#脚本
          }
      }
  }
  ```

  用**运行脚本map**存储这些**封装的**mono类**对象**（用封装的Mono类实例化）

  - key是实体的UUID

  再调用C#类的OnCreate函数（初始化）

  ```cpp
  void ScriptEngine::OnCreateEntity(Entity entity)
  {
      const auto& sc = entity.GetComponent<ScriptComponent>();		// 得到这个实体的组件
      if (ScriptEngine::EntityClassExists(sc.ClassName)) {			// 组件的脚本名称是否正确
          Ref<ScriptInstance> instance = CreateRef<ScriptInstance>(s_Data->EntityClasses[sc.ClassName], entity);// 实例化类对象，并存储OnCreate、OnUpdate函数，调用父类Entity的构造函数，传入实体的UUID
          s_Data->EntityInstances[entity.GetUUID()] = instance;	// 运行脚本map存储这些ScriptInstance(类对象)
          instance->InvokeOncreate();								// 调用C#的OnCreate函数
      }
  }
  ```

  存储OnCreate、OnUpdate函数，并调用C#父类Entity的构造函数传入当前实体的**UUID**给C#

  （C#脚本有UUID后，**C#的一个脚本**才能 与 拥有这个C#脚本的**C++实体**联系在一起）

  ```cpp
  ScriptInstance::ScriptInstance(Ref<ScriptClass> scriptClass, Entity entity)
  :m_ScriptClass(scriptClass)
  {
      // 获取Sandbox Player类构成的MonoObject对象，相当于new Sandbox.Player()
      m_Instance = scriptClass->Instantiate();	
  
      m_Constructor = s_Data->EntityClass.GetMethod(".ctor", 1);// 获取C#Entity类的构造函数
      m_OnCreateMethod = scriptClass->GetMethod("OnCreate", 0);// 获取并存储Sandbox.Player类的函数
      m_OnUpdateMethod = scriptClass->GetMethod("OnUpdate", 1);
      // 调用C#Entity类的构造函数
      {
      UUID entityID = entity.GetUUID();
      void* param = &entityID;
      m_ScriptClass->InvokeMethod(m_Instance, m_Constructor, &param);// 第一个参数传入的是Entity子类(Player)构成的mono对象
      }
  }
  ```

- 在运行场景的update函数，循环遍历当前所有**具有脚本组件**的实体

  ```cpp
  void Scene::OnUpdateRuntime(Timestep ts)
  {
      // 脚本
      {
          ScriptEngine::OnRuntimeStart(this);
          // 实例化实体中的C#脚本
          auto view = m_Registry.view<ScriptComponent>();
          for (auto e : view) {
              Entity entity = { e, this };
              ScriptEngine::OnUpdateEntity(entity, ts);
          }
      }
  ```

  根据UUID在**运行脚本map**找到这个**封装的**mono类对象，并调用C#类的OnUpdate函数

  ```cpp
  void Hazel::ScriptEngine::OnUpdateEntity(Entity entity, Timestep ts)
  {
      UUID entityUUID = entity.GetUUID();							// 得到这个实体的UUID
      HZ_CORE_ASSERT(s_Data->EntityInstances.find(entityUUID) != s_Data->EntityInstances.end());
  
      // 根据UUID获取到ScriptInstance的指针
      Ref<ScriptInstance> instance = s_Data->EntityInstances[entityUUID];
      instance->InvokeOnUpdate((float)ts);							// 调用C#的OnUpdate函数
  }
  ```

## 其它要写的代码（省略）

- 定义C#脚本组件
- 面板显示脚本组件
- 序列化和解析Yaml文件加上脚本组件

# 效果

![1.xiaoguo](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308131814625.gif)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125885.png)

# Cherno遇到的BUG

- C++把实体的UUID作为实参传给C#脚本类的构造函数，以便C#脚本能与实体联系起来。

  C#中Sandbox.Player脚本继承Entity类，Entity类**有带参**的构造函数，Player类**没有带参**的构造函数

  ```c#
  public class Entity
  {
      public readonly ulong ID;   // 实体的UUID
      protected Entity() { Console.WriteLine("Entity()"); ID = 0; }
      internal Entity(ulong id)
      {ID = id; }// C++此构造函数传入实体的UUID
  ```

  若在C++中使用Player类的构造函数，把UUID传给Player

  ```cpp
  // 获取Sandbox Player类构成的MonoObject对象，相当于new Sandbox.Player()
  m_Instance = scriptClass->Instantiate();	
  
  m_Constructor = scriptClass.GetMethod(".ctor", 1);// 获取C#Player类的构造函数
  m_OnCreateMethod = scriptClass->GetMethod("OnCreate", 0);// 获取并存储Sandbox.Player类的函数
  m_OnUpdateMethod = scriptClass->GetMethod("OnUpdate", 1);
  // 调用C#Player类的构造函数
  {
      UUID entityID = entity.GetUUID();
      void* param = &entityID;
      m_ScriptClass->InvokeMethod(m_Instance, m_Constructor, &param);
  }
  ```

  是不行的，因为Player**并没有带参**的构造函数，毕竟在C#本地执行new Player带参的构造函数也不行的

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125894.png)

  所以C++的代码，需调用**Entity**类的构造函数，参数用Player的实例mono对象

  ```cpp
  // 获取Sandbox Player类构成的MonoObject对象，相当于new Sandbox.Player()
  m_Instance = scriptClass->Instantiate();	
  
  // 这里不一样，是获取父类Entity的构造函数
  m_Constructor = s_Data->EntityClass.GetMethod(".ctor", 1);// 获取C#Entity类的构造函数
  m_OnCreateMethod = scriptClass->GetMethod("OnCreate", 0);// 获取并存储Sandbox.Player类的函数
  m_OnUpdateMethod = scriptClass->GetMethod("OnUpdate", 1);
  // 调用C#Entity类的构造函数
  {
      UUID entityID = entity.GetUUID();
      void* param = &entityID;
      m_ScriptClass->InvokeMethod(m_Instance, m_Constructor, &param);// 第一个参数传入的是Entity子类(Player)构成的mono对象
  }
  ```

  关于s_Data->EntityClass是父类Mono对象，是一开始加载C#dll时特别加载的

  ```cpp
  // S_Data结构体
  struct ScriptEngineData {
  	......
  
      ScriptClass EntityClass;// 存储C#父类Entity的Mono类
  
  	......
  };
  void ScriptEngine::Init()
  {
      s_Data = new ScriptEngineData();
      // 初始化mono
      InitMono();
      // 加载c#程序集
      LoadAssembly("Resources/Scripts/GameEngine-ScriptCore.dll");				// 核心库
      LoadAppAssembly("SandboxProject/Assets/Scripts/Binaries/Sandbox.dll");// 游戏脚本库
  
      // 加载父类是entity的脚本类
      LoadAssemblyClasses();
  
      // 创建加载Entity父类-为了在调用OnCreate函数之前把UUID传给C#Entity的构造函数
      s_Data->EntityClass = ScriptClass("Hazel", "Entity", true);
  ```



