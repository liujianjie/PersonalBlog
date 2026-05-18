> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为完成在编辑器面板上可以显示C#脚本类的属性，对属性的值修改，C#脚本会**热更新**（mono4.5api支持）

- 如何实现

  使用mono的api，根据类名获取和设置属性的值

  参考mono官方api网址：[http://docs.go-mono.com/?link=xhtml%3adeploy%2fmono-api-class.html](http://docs.go-mono.com/?link=xhtml%3adeploy%2fmono-api-class.html)

- 实现细节

  - 由于C#类类型名称有点不太一眼看出什么意思，所以要**自定义类类型**，并用map来进行C#类型名称标识转换。

    比如：C#的**float**空间名+类名是->**System.Single**，需转换我们自定义的类名称**“Float”。**

    自定义的类名称需接近C++类名，容易标识。

  - 考虑设计：

    每一个脚本有多个它的属性和值，若将map<属性name, value> 声明为ScriptComponent组件下，虽然是合理的，但是map在组件下要考虑序列化和反序列化，有点麻烦所以舍弃这条路。

    视频的方案是设计map<属性name，struct{}>，struct里有属性值等，并将此map放在由加载的C#类抽象的**ScriptClass类**中，这样并不用考虑序列化数据存储问题，但是每次程序启动都需要**获取C#脚本类的属性**，存在map中

# 文字讲述：实现思路

- 一个C#脚本对应一个ScriptClass类，ScriptClass类中有**map（fieldmap）**保存这个C#脚本的属性与值类型。

  - 在加载dll后，读取游戏脚本库的类名，加载C#类得到**封装的MonoClass对象**

  - 再根据MonoClass（反射）得到C#类的所有**属性**

  - 循环属性，得到单个MonoClassField对象，根据MonoClassField（反射）得到C#属性的名称、访问权限、类型

  - 根据权限决定map是否存储这个属性

- 运行游戏时，因120节的**运行脚本map**存储运行时的ScriptInstance指针，用来执行特定需要在OnUpdate中更新的脚本。

  - 当前设计

    - ScriptEngine类

      封装 加载构建Mono环境类

    - ScriptClass类

      封装 加载C#类成Mono类 的类

    - ScriptInstance类

      封装 由Mono类**实例化**的Mono类**对象**

  - ScriptInstance与ScriptClass类

    1. ScriptInstance类（实例对象Class cl = new Class()）中有对ScriptClass类（抽象类Class）的引用，它们两关系相当于**一对多**。
    2. ScriptInstance的一个实例对象必有一个ScriptClass对象
    3. ScriptInstance是运行时创建<font color = "red">封装的Mono**类对象**</font>、ScriptClass是加载检测dll创建<font color="green">封装的**Mono类**</font>。

  由此，可以用**运行脚本map[当前实体的UUID]**->ScriptInstance->ScriptClass->**fieldmap**

  这fieldmap存储当前C#脚本的所有属性

- 得到了对应属性的名称，在可以用Mono的API来获取和设置这个属性的值

# 代码讲述：思路+关键代码

## 关键代码

mono的API

```cpp
// 获取所有属性
mono_class_get_fields()
// 得到单个属性
MonoClassField* field = mono_class_get_fields(monoClass, &iterator)
// 获取单个属性的名称
mono_field_get_name(field)
// 获取单个属性的权限
mono_field_get_flags(field)
// 获取单个属性的类类型
mono_field_get_type(field)    
// 设置和获取属性值
mono_field_get_value(m_Instance, field.ClassField, buffer);
mono_field_set_value(m_Instance, field.ClassField, (void*)value);
```

## 代码思路

- 一个C#脚本对应一个ScriptClass类，ScriptClass类中有**map（fieldmap）**保存这个C#脚本的属性与值类型。

  - 在加载dll后，读取游戏脚本库的类名，加载C#类得到**封装的MonoClass对象**
  - 再根据MonoClass（反射）得到C#类的所有**属性**

  - 循环属性，得到单个MonoClassField对象，根据MonoClassField（反射）得到C#属性的名称、访问权限、类型

  - 根据权限决定**map**是否存储这个属性

  ```cpp
  // 属性名称对应的结构体
  struct ScriptField {
      ScriptFieldType Type;
      std::string Name;
  
      MonoClassField* ClassField;
  };
  class ScriptClass {
      public:
      ScriptClass() = default;
      ScriptClass(const std::string& classNamespace, const std::string& className, bool isCore = false);		// 119.3. 创建一个MonoClass类
      MonoObject* Instantiate();// 119.4.创建一个由MonoClass类构成的mono对象并且初始化
      MonoMethod* GetMethod(const std::string& name, int parameterCount);	// 119.5.1 获取类的函数
      // 119.5.2 调用类的函数
      MonoObject* InvokeMethod(MonoObject* instance, MonoMethod* method, void** params = nullptr);
      // 123.属性
      const std::map<std::string, ScriptField>& GetFields() const { return m_Fields; }
      private:
      std::string m_ClassNamespace;
      std::string m_ClassName;
      MonoClass* m_MonoClass = nullptr;
  
      std::map<std::string, ScriptField> m_Fields; // map
  
      friend class ScriptEngine;
  };
  void ScriptEngine::LoadAssemblyClasses()
  {
      .....
      for (int32_t i = 0; i < numTypes; i++)
      {
          .....
          // 2.加载Dll中所有C#类
          MonoClass* monoClass = mono_class_from_name(s_Data->AppAssemblyImage, nameSpace, className);
  		.....
          // 123：读取脚本类的属性
          int fieldCount = mono_class_num_fields(monoClass);		
          HZ_CORE_WARN("{} has {} fields:", className, fieldCount);
          void* iterator = nullptr;
          // 获取所有属性，并得到单个属性
          while (MonoClassField* field = mono_class_get_fields(monoClass, &iterator))
          {
              const char* filedName = mono_field_get_name(field);// 获取单个属性的名称
              uint32_t flags = mono_field_get_flags(field);		// 获取单个属性的权限
              if (flags & FIELD_ATTRIBUTE_PUBLIC) { 				// &按位与 1 1=1，1 0 = 0,0 1 = 0
                  MonoType* type = mono_field_get_type(field);	// 获取单个属性的类类型
                  ScriptFieldType fieldType = Utils::MonoTypeToScriptFieldType(type);
                  HZ_CORE_TRACE("	{}({})", filedName,Utils::ScriptFieldTypeToStirng(fieldType));
                  // 用Map存储这个属性
                  scriptClass->m_Fields[filedName] = { fieldType, filedName, field };
              }
          }
      }
  ```

- 运行游戏时，在编辑面板可以用**运行脚本map[当前实体的UUID]**->ScriptInstance->ScriptClass->**fieldmap**

  这**fieldmap**存储当前C#脚本的所有属性

  ```cpp
  // 实体的脚本组件 mutable去除常量属性
  DrawComponent<ScriptComponent>("Script", entity, [entity](auto& component)mutable
  {
  	.....
  	if (ImGui::InputText("Class", buffer, sizeof(buffer))) {
  		component.ClassName = buffer;
  	}
  	// 123：c#脚本属性
  	// UUID->ScriptInstance->ScriptClass->fieldmap
  	Ref<ScriptInstance> scriptInstance = ScriptEngine::GetEntityScriptInstance(entity.GetUUID());
  	if (scriptInstance) {
          /////////////////////////////////////////////
          /////////////////////////////////////////////
          // 读取map中的属性
  		const auto& fields = scriptInstance->GetScriptClass()->GetFields();
  		for (const auto& [name, field] : fields)// 获取保存的属性名称
  		{
  			if (field.Type == ScriptFieldType::Float) {
  				float data = scriptInstance->GetFieldValue<float>(name);// 下一步有函数定义：获取属性值
  				if (ImGui::DragFloat(name.c_str(), &data)) {
  						scriptInstance->SetFieldValue(name, data);// 下一步有函数定义：设置属性值
  				}
  			}
  		}
  	}
  ```

- 得到了对应属性的名称，在可以用Mono的API来**获取**和**设置**这个属性的值

  ```cpp
  // 获取属性值的api
  template<typename T>
  T GetFieldValue(const std::string& name) // 
  {
      bool success = GetFieldValueInternal(name, s_FieldValueBuffer);
      if (!success)
          return T();
      return *(T*)s_FieldValueBuffer;
  }
  bool ScriptInstance::GetFieldValueInternal(const std::string& name, void* buffer)
  {
      const auto& fields = m_ScriptClass->GetFields();
      auto it = fields.find(name);
      if (it == fields.end()) {
          return nullptr;
      }
      const ScriptField& field = it->second;
      //////////////////////////////////////////////////////
      //////////////////////////////////////////////////////
      // mono的API
      mono_field_get_value(m_Instance, field.ClassField, buffer); 
      return true;
  }
  ```

  ```cpp
  // 设置属性值的api
  template<typename T>
  void SetFieldValue(const std::string& name,  T& value)
  {
      SetFieldValueInternal(name, &value);// 引用变量的地址 等于 被引用变量的地址
  }
  bool ScriptInstance::SetFieldValueInternal(const std::string& name, void* value)
  {
      const auto& fields = m_ScriptClass->GetFields();
      auto it = fields.find(name);
      if (it == fields.end()) {
          return false;
      }
      const ScriptField& field = it->second;
      //////////////////////////////////////////////////////
      //////////////////////////////////////////////////////
      // mono的API
      mono_field_set_value(m_Instance, field.ClassField, (void*)value);
      return true;
  }
  ```

# 效果

1. 获取属性

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126715.png)

2. 游戏运行时为设置speed属性值

   ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126812.png)

3. 游戏运行时设置speed属性值

   ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126291.png)

4. gift效果

   当调整为0.1的速度，wasd明显受阻，而调整到0.5，速度明显提升（说明热更新成功）

   ![1.xiaoguo1232](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126824.gif)

# 后续要优化

- 此节已完成

  此节完成在运行时在面板可见C#脚本的属性，并且修改属性的值后，可以**立马更新**C#脚本属性的值

- 缺点

  但是运行前（编辑时）**并不显示**C#脚本的属性，更不能修改。

- 应该要优化地方

  应该实现在**编辑时**能检测C#脚本的属性，并且可以设置值，在运行时读取编辑时设置的值。

- 实现思路

  在编辑时可以用map存储脚本属性值，等到运行时根据map读取编辑时设置的属性值。

# 发现的Bug

- SceneHierarchyPanel.cpp

  在界面上写显示C#脚本的属性

  - 报错截图

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126799.png)

  - 解决方法

    给lambda声明为mutable，把捕获的变量去除**const**

  - 原因分析

    由于lambda**默认不修改**捕获变量，所以**捕获变量entity被赋为const**的，而entity未设置const的GetUUID()函数，所以报错

- ScriptEngine.h

  在ScriptInstance类中写模板函数程序会报错，报红，如下

  - 报错截图

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126815.png)

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126005.png)

  - 解决方法

    测试后，需将ScriptClass类、ScriptInstance类、ScriptEngine类的**顺序声明**才行。

  - 原因分析

    之前会报错的顺序为 ScriptEngine类、ScriptInstance类、ScriptClass类。

    因为ScriptEngine使用了ScriptInstance，而ScriptEngine在ScriptInstance之前，所以找不到类声明，需要调整顺序即可

- MonoApi获取属性的值

  视频中Cherno直接用字符指针来获取值，说由于要缓冲，所以没用void\*，所以我测试用void\*来获取值，毕竟因为monoapi也只是void*指针

  ```cpp
  // monoapi mono_field_get_value函数是void*指针
  MONO_API MONO_RT_EXTERNAL_ONLY void
  mono_field_get_value (MonoObject *obj, MonoClassField *field, void *value);
  ```

  - 报错截图

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126133.png)

    如图：使用了void* result来传给mono_field_get_value函数

  - 原因分析

    `void* result;`声明了一个指针，但是并没有**为其分配内存**。当试图通过`mono_field_get_value`函数将值存储在`result`指向的内存中时，由于没有分配内存，就会导致访问冲突。

  - 正常解决方法

    ```cpp
    inline static void* result = malloc(8);// void数组
    template<typename T>
    T GetFieldValue(const std::string& name)
    {
        bool success = GetFieldValueInternal(name, result);// void数组
        if (!success)
            return T();
        return *(T*)result;
    }
    bool ScriptInstance::GetFieldValueInternal(const std::string& name, void* buffer)
    {
        const auto& fields = m_ScriptClass->GetFields();
        auto it = fields.find(name);
        if (it == fields.end()) {
            return nullptr;
        }
        const ScriptField& field = it->second;
        mono_field_get_value(m_Instance, field.ClassField, buffer);// void指针传入
        return true;
    }
    ```

  - **回归本源**解决方法1

    照着视频的改成**字符数组**就行了

    ```cpp
    inline static char s_FieldValueBuffer[8];// 字符数组
    template<typename T>
    T GetFieldValue(const std::string& name)
    {
        bool success = GetFieldValueInternal(name, s_FieldValueBuffer); // 注意区分，传入的实参不同
        if (!success)
            return T();
        return *(T*)s_FieldValueBuffer;
    }
    bool ScriptInstance::GetFieldValueInternal(const std::string& name, void* buffer)
    {
        const auto& fields = m_ScriptClass->GetFields();
        auto it = fields.find(name);
        if (it == fields.end()) {
            return nullptr;
        }
        const ScriptField& field = it->second;
        mono_field_get_value(m_Instance, field.ClassField, buffer);// 字符数组指针传入
        return true;
    }
    ```

    

    

  