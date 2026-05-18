> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  1. 由上节根据UUID获取实体的translation在根据wsad调**整实体的位置**

  2. 此节优化上节所做，实体的translation应属于实体的TransformComponent，所以此节需要在C#**创建组件类**

  3. 用UUID，C#组件类**对应**cpp的组件类。

- 为完成像Unity的C#脚本API

  能在C#获取当前实体在cpp的Rigidbody2DComponent组件

  ```cpp
  m_Rigidbody = GetComponent<Rigidbody2DComponent>();
  ```

  并C#可以通过组件实例对象操作实体

  比如给实体添加物理冲力

  ```cpp
  m_Rigidbody.ApplyLinearImpulse(velocity.XY, true);
  ```

# 文字叙述：实现相关思路

- 如何实现

  1. 照样用118和119两节讲的C#与cpp相互调用对方的函数。
  2. 此节更多的是**高级语法+设计**如何实现。

- 核心思想

  ```c#
  TransformComponent tfs = GetComponent<TransformComponent>();// C#
  ```

  1. tfs得到的是C#声明的TransformComponent类
  2. 只不过这个类的实现功能的函数（如：改变实体的位置）是调用C++的**内部函数**
  3. 从而实现给开发者一种**欺骗**：仿佛获得了cpp引擎内部的TransformComponent组件类。。。

- 实现步骤

  1. C#写好组件相应类

  2. C++加载C#dll程序集完后

     - 根据C#组件类名反射C#的组件类得到MonoType指针对象
     - 并用**map存储<MonoType指针, function>**，function是用来调用C++的Entity是否有对应组件

  3. C#相关脚本类在OnCreate函数中获取需要的组件

     - 调用GetComponent\<Component>()获取脚本挂载的实体**对应的组件**
     - 但这获取，实际上需先调用cpp的内部函数，根据传入的UUID获取实体，并根据传入的C#类类型再次**反射**得到**MonoType指针对象**
     - 调用上一步**map[类型指针]**的function判断在C++中是否存在对应的组件
     - 若实体存在对应组件，就**返回C#本地组件类的实例化**，来达到上述所说的"欺骗"。

  4. C#在相关脚本类的OnUpdate函数对*"获取到的组件"*的属性修改或者函数调用

     实际上都是根据传入UUID，调用**C++内部函数**来实现

# 代码叙述：实现思路+相关代码

## 代码思路

- C#写好组件相应类

  ```cpp
  public abstract class Component{
      public Entity Entity { get; set; }
  }
  public class TransformComponent : Component { 
      public Vector3 Translation{
          get{
              InternalCalls.TransformComponent_GetTranslation(Entity.ID, out Vector3 translation);
              return translation;
          }
          set{
              InternalCalls.TransformComponent_SetTranslation(Entity.ID, ref value);
          }
      }
  }
  public class Rigidbody2DComponent : Component{
      public void ApplyLinearImpulse(Vector2 impulse, Vector2 worldPosition, bool wake){
          InternalCalls.Rigidbody2DComponent_ApplyLinearImpulse(Entity.ID, ref impulse, ref worldPosition, wake); ;
      }
      public void ApplyLinearImpulse(Vector2 impulse, bool wake){
          InternalCalls.Rigidbody2DComponent_ApplyLinearImpulseToCenter(Entity.ID, ref impulse, wake); ;
      }
  }
  ```

- C++加载C#dll程序集完后

  根据C#组件类名**反射**C#的组件类得到MonoType指针对象

  并用**map存储<MonoType指针, function>**，function是用来调用C++的Entity是否有对应组件

  ```cpp
  // map<MonoType*, std::function<bool(Entity)>，value是一个function
  static std::unordered_map<MonoType*, std::function<bool(Entity)>> s_EntityHasComponentFuncs;
  
  // 这个写法模板参数包的转发与展开已在115节说明了
  template<typename... Component>
  static void RegisterComponent() {
      ([]()
       {
           std::string_view typeName = typeid(Component).name();
           size_t pos = typeName.find_last_of(':');
           std::string_view structName = typeName.substr(pos + 1);
           std::string managedTypname = fmt::format("Hazel.{}", structName);// 组成新字符串只能用string接收
           
           ///////////////////////////////////////
  		 // 根据C#组件类名反射C#的组件类得到MonoType指针对象
           MonoType* managedType = mono_reflection_type_from_name(managedTypname.data(), ScriptEngine::GetCoreAssemblyImage()); // managedTypname.data() = managedType.ctr();
           if (!managedType) {
               HZ_CORE_ERROR("Could not find component type{}", managedTypname);
               return;
           }
           HZ_CORE_TRACE(managedTypname);// Hazel.Rigidbody2DComponent
           
           ///////////////////////////////////////
           // 并用**map存储<MonoType指针, function>**，function是用来调用C++的Entity是否有对应组件
           s_EntityHasComponentFuncs[managedType] = [](Entity entity) {return entity.HasComponent<Component>(); };// Component是展开的模板参数包
       }(), ...);
  }
  template<typename... Component>
  static void RegisterComponent(ComponentGroup<Component...>){
      RegisterComponent<Component...>();
  }
  void ScriptGlue::RegisterComponents(){
      RegisterComponent(AllComponents{}); 
  }
  ```

- C#相关脚本类在OnCreate函数中获取需要的**组件**

  - 调用GetComponent\<Component>()获取脚本挂载的实体**对应的组件**

    ```C#
    // C#
    void OnCreate()
    {
        Console.WriteLine($"Player.OnCreate() - {ID}");
        m_Transform = GetComponent<TransformComponent>();
        m_Rigidbody = GetComponent<Rigidbody2DComponent>();
    }
    public T GetComponent<T>() where T : Component, new()
    {
        if (!HasComponent<T>())
        {
            return null;
        }
        T component = new T() { Entity = this };// 返回本地类实例对象
        return component;
    }
    // C#的泛型
    public bool HasComponent<T>() where T : Component, new()// new()是确保有空构造函数{
        Type componentType = typeof(T);// 得到命名空间.类名名称，比如Sandbox.Player
        return InternalCalls.Entity_HasComponent(ID, componentType);
    }
    ```

  - 但这获取

    实际上需先调用C++的内部函数，根据传入的UUID获取实体，并根据传入的C#类类型再次**反射**得到**MonoType指针对象**

    调用上一步**map[类型指针]**的function判断在C++中是否存在对应的组件

    ```cpp
    cpp
    static bool Entity_HasComponent(UUID entityID, MonoReflectionType* componentType) {
        Scene* scene = ScriptEngine::GetSceneContext();
        HZ_CORE_ASSERT(scene);
        Entity entity = scene->GetEntityByUUID(entityID);
        HZ_CORE_ASSERT(entity);
        // C#的typeof(T)是Sandbox.Player的类型，根据传入C#类类型再次**反射**得到**MonoType指针对象**
        MonoType* managedType = mono_reflection_type_get_type(componentType);
        HZ_CORE_ASSERT(s_EntityHasComponentFuncs.find(managedType) != s_EntityHasComponentFuncs.end());
        return s_EntityHasComponentFuncs.at(managedType)(entity);// 找到并调用function
    }
    ```

  - 若实体存在对应组件，就**返回C#本地组件类的实例化**，来达到上述所说的"欺骗"。

    C#

    ```c#
    public T GetComponent<T>() where T : Component, new(){
        if (!HasComponent<T>()){
            return null;
        }
        T component = new T() { Entity = this };// 返回本地类实例对象
        return component;
    }
    ```

- C#在相关脚本类的OnUpdate函数对*"获取到的组件"*的属性修改或者函数调用

  实际上都是根据传入UUID，调用**C++内部函数**来实现

  ```c#
  C#
  m_Rigidbody.ApplyLinearImpulse(velocity.XY, true);
  ```

  ```c#
  internal extern static void Rigidbody2DComponent_ApplyLinearImpulse(ulong entityID, ref Vector2 impulse, ref Vector2 point, bool wake);
  [MethodImplAttribute(MethodImplOptions.InternalCall)]
  internal extern static void Rigidbody2DComponent_ApplyLinearImpulseToCenter(ulong entityID, ref Vector2 impulse, bool wake);
  ```

  ```cpp
  cpp
  static void Rigidbody2DComponent_ApplyLinearImpulse(UUID entityID, glm::vec2* impulse, glm::vec2* point, bool wake) {
      Scene* scene = ScriptEngine::GetSceneContext();
      HZ_CORE_ASSERT(scene);
      Entity entity = scene->GetEntityByUUID(entityID);
      HZ_CORE_ASSERT(entity);
  
      auto& rb2d = entity.GetComponent<Rigidbody2DComponent>();
      b2Body* body = (b2Body*)rb2d.RuntimeBody;
      body->ApplyLinearImpulse(b2Vec2(impulse->x, impulse->y), b2Vec2(point->x, point->y), wake);
  }
  ```

# 效果

![1.xiaoguo](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125822.gif)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125835.png)



# 我遇到的BUG

- 若在默认的构造函数中GetComponent\<TransformComponent>();会报错

  1. GetComponent\<TransformComponent>();传入UUID给cpp内部函数验证是否存在模板组件
  2. 但是此时UUID为0，根据UUID获取实体调用相关函数则会报错
  3. **因为cpp还未给带参的构造函数赋值**，UUID即未与实体关联起来
  4. 代码调用顺序是实例化时会调用C#脚本默认的无参构造函数
  5. 再调用C#脚本带参的构造函数给C#脚本UUID与实体联系起来

  ```cpp
  ScriptInstance::ScriptInstance(Ref<ScriptClass> scriptClass, Entity entity)
      :m_ScriptClass(scriptClass)
  {
  	// 获取Sandbox Player类构成的MonoObject对象，相当于new Sandbox.Player()
      m_Instance = scriptClass->Instantiate();	// 4.先调用C#脚本默认的无参构造函数//////////////////////////
  
      m_Constructor = s_Data->EntityClass.GetMethod(".ctor", 1);// 获取C#Entity类的构造函数
      m_OnCreateMethod = scriptClass->GetMethod("OnCreate", 0);// 获取并存储Sandbox.Player类的函数
      m_OnUpdateMethod = scriptClass->GetMethod("OnUpdate", 1);
      // 5.再调用C#脚本带参的构造函数//////////////////////////////////
      {
      	UUID entityID = entity.GetUUID();
          void* param = &entityID;
          m_ScriptClass->InvokeMethod(m_Instance, m_Constructor, &param);// 第一个参数传入的是Entity子类(Player)构成的mono对象
      }
  }
  MonoObject* ScriptEngine::InstantiateClass(MonoClass* monoClass)
  {
      // 创建一个Main类构成的mono对象并且初始化
      MonoObject* instance = mono_object_new(s_Data->AppDomain, monoClass);
      mono_runtime_object_init(instance);// 构造函数在这里调用
      return instance;
  }
  ```

  所以C#获取脚本组件的代码**应放在OnCreate函数中**，在此函数之前，UUID才被赋值

  ```c#
  void OnCreate()
  {
      Console.WriteLine($"Player.OnCreate() - {ID}");
      m_Transform = GetComponent<TransformComponent>();
      m_Rigidbody = GetComponent<Rigidbody2DComponent>();
  }
  ```

# Cherno讲的string知识

- 减少string内存

  在根据组件类名反射C#的组件类得到MonoType指针对象。

  这一步获取组件类名这里，其实进行对组件类名string拼装才能正确反射。

  若对组件类名string存储和操作不当会造成**不必要的内存**，如下代码

  ```cpp
  std::string typeName = typeid(Component).name();
  size_t pos = typeName.find_last_of(':');
  std::string structName = typeName.substr(pos + 1);
  std::string managedTypname = fmt::format("Hazel.{}", structName);
  ```

  创建的字符串有

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125837.png)

  对string的操作应该用**string_view**存储可以避免多余的内存

  ```cpp
  std::string_view typeName = typeid(Component).name();
  size_t pos = typeName.find_last_of(':');
  std::string_view structName = typeName.substr(pos + 1);
  std::string managedTypname = fmt::format("Hazel.{}", structName);// 组成新字符串只能用string接收
  ```

  创建的字符串有

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125454.png)