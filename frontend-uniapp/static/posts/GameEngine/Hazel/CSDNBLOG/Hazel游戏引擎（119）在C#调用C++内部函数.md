> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  - 上一节实现了**cpp调用c#函数**

    这一节要实现**C#调用cpp内部函数**，这样才可以算得上脚本

  - 封装类

    1. 封装加载构建mono环境、Mono类

       - ScriptEngine类

         封装 加载构建Mono环境类

       - ScriptClass类

         封装 加载C#类成Mono类 的类

    2. 封装，C#调用cpp内部函数，需向C#提供的接口，成为类

- 如何实现

  Cherno参考Mono官方文档：[https://www.mono-project.com/docs/advanced/embedding/](https://www.mono-project.com/docs/advanced/embedding/)（带有例子）

  完整mono文档：[http://docs.go-mono.com/?link=xhtml%3adeploy%2fmono-api-assembly.html](http://docs.go-mono.com/?link=xhtml%3adeploy%2fmono-api-assembly.html)

# 目的1：C#调用Cpp函数例子

## 1. 无返回值、无参数

- C#

  ```c#
  using System;
  using System.Runtime.CompilerServices;
  
  namespace Hazel{
      public class Main
      {
          public float FloatVar { get; set; }
          public Main()
          {
              Console.WriteLine("Main constructor!");
              CppFunction();// 调用cpp的函数
          }
          ///////////////////////////////////////////////////////
          // 此节////////////////////////////////////////////////
          // 声明为内部调用：声明这个函数的定义在cpp内部被实现
          [MethodImplAttribute(MethodImplOptions.InternalCall)]
          extern static void CppFunction();
          
          // 上一118节的函数：cpp调用C#而声明的函数
          public void PrintMessage()
          {
              Console.WriteLine("Hello World from C#!");
          }
          public void PrintInt(int value)
          {
              Console.WriteLine($"C# says: {value}");
          }
          public void PrintInts(int value1, int value2)
          {
              Console.WriteLine($"C# says: {value1} and {value2}");
          }
          public void PrintCustomMessage(string message)
          {
              Console.WriteLine($"C# says: {message}");
          }
      }
  }
  
  ```

- C++

  ```cpp
  static void CppFunc() {
      std::cout << "来自cpp内部函数" << std::endl;
  }
  void ScriptEngine::InitMono()
  {
      // 设置程序集装配路径(复制的4.5版本的路径)
      mono_set_assemblies_path("mono/lib");
  
      MonoDomain* rootDomian = mono_jit_init("HazelJITRuntime");
      HZ_CORE_ASSERT(rootDomian);
  
      // 存储root domain指针
      s_Data->RootDomain = rootDomian;
  
      // 创建一个app domain
      s_Data->AppDomain = mono_domain_create_appdomain("HazelScriptRuntime", nullptr);
      mono_domain_set(s_Data->AppDomain, true);
  	
      ////////////////////////////////////////////////////////////////
      // 这里/////////////////////////////////////////////////////////
      // 添加内部调用//////////////////////////////////////////////////
      mono_add_internal_call("Hazel.Main::CppFunction", CppFunc);
      // 指的是C#的Hazel命名空间下的Main类的CppFunction函数  被C++的CppFunc给定义
  ```

  - Tips：Hazel.Main::CppFunction

    1. "."后面是**类**
    2. ::后面是**函数**

    指的是C#的Hazel命名空间下的Main类的CppFunction函数，被C++的CppFunc函数给**定义**

- 效果

  ![](../图片/119.C井调用C++内部函数/云/xiu9nNAZGyPodsM.png)

## 2. 带有参数

- C#

  ```c#
  public Main()
  {
      Console.WriteLine("Main constructor!");
      CppFunction();
      NativeLog("liujianjie", 2023);
  }
  [MethodImplAttribute(MethodImplOptions.InternalCall)]
  extern static void CppFunction();
  // 带有参数
  [MethodImplAttribute(MethodImplOptions.InternalCall)]
  extern static void NativeLog(string text, int parameter);
  ```

- C++

  ```cpp
  static void NativeLog(MonoString* string, int parameter) { // C++内部定义
      char* cStr = mono_string_to_utf8(string);
      std::string str(cStr);// 复制数据给str
      mono_free(cStr);
      std::cout << str << "," << parameter << std::endl;
  }
  mono_add_internal_call("Hazel.Main::NativeLog", NativeLog);// 互绑
  ```

- 效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132123706.png)

## 3. 带有结构体参数

- C#

  ```c#
  public Main()
  {
      Console.WriteLine("Main constructor!");
      CppFunction();
      NativeLog("liujianjie", 2023);
      Vector3 vec1 = new Vector3(5, 2.5f, 1);
      //Vector3 vec2;
      NativeLogVec3(ref vec1, out Vector3 vec2);
      Console.WriteLine($"{vec2.X}, {vec2.Y}, {vec2.Z}");
  }
  extern static void NativeLogVec3(ref Vector3 vec, out Vector3 vec2);
  [MethodImplAttribute(MethodImplOptions.InternalCall)]
  ```

- cpp

  ```cpp
  static void NativeLogVec3(glm::vec3* vec, glm::vec3* out) {
      //HZ_CORE_WARN("Value: {0}", *vec); // 这会错的，并不支持输出向量
      std::cout << vec->x << "," << vec->y <<","<<vec->z << std::endl;
      *out = glm::cross(*vec, glm::vec3(vec->x, vec->y, -vec->z)); // 通过out返回指针
  }
  mono_add_internal_call("Hazel.Main::TestNativeLogVec3", TestNativeLogVec3);
  ```

- 效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132123755.png)

- 注意Bug

  由于结构体带有指针，需要**申请内存**

  - 若在cpp函数内申请内存

    ```cpp
    static glm::vec3* NativeLogVec3(glm::vec3* vec) {
        std::cout <<"TestNativeLogVec3" << std::endl;
        glm::vec3 result = glm::cross(*vec, glm::vec3(vec->x, vec->y, -vec->z));
        return &result;
    }
    // 因为result是局部变量，函数结束后会被销毁result的内存，所以返回的内存是空的
    ```

    ```cpp
    static glm::vec3* NativeLogVec3(glm::vec3* vec) {
        std::cout <<"TestNativeLogVec3" << std::endl;
        glm::vec3 result = glm::cross(*vec, glm::vec3(vec->x, vec->y, -vec->z)); // 通过out返回指针
        return new glm::vec3(result); // 尝试new 
    }
    // new出来的内存，是在cpp本地分配的，传给C#访问的地方也还是无效。。。
    ```

  - 错误结果

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132123608.png)



# 目的2：封装抽象类

- ScriptClass

  ```cpp
  #pragma once
  #include <filesystem>
  #include <string>
  
  // 如果不引入头文件，必须外部声明，但这些都是在c文件定义的结构，所以需要extern"C"
  extern "C" {
  	typedef struct _MonoClass MonoClass;
  	typedef struct _MonoObject MonoObject;
  	typedef struct _MonoMethod MonoMethod;
  }
  namespace Hazel {
  	class ScriptEngine
  	{
  	public:
  		static void Init();		// 初始化
  		static void Shutdown();	// 关闭
  
  		static void LoadAssembly(const std::filesystem::path& filepath);	// 2.加载dll程序集
  	private:
  		static void InitMono();		// 1.初始化mono
  		static void ShutdownMono();	// 关闭mono
  
  		static MonoObject* InstantiateClass(MonoClass* monoClass);	// 实例化Mono类为Mono实例对象
  		friend class ScriptClass;
  	};
  	class ScriptClass {
  	public:
  		ScriptClass() = default;
  		ScriptClass(const std::string& classNamespace, const std::string& className);// 3. 创建一个MonoClass类
  
  		MonoObject* Instantiate();// 4.创建一个由MonoClass类构成的mono对象并且初始化
  		MonoMethod* GetMethod(const std::string& name, int parameterCount);// 5.1 获取类的函数
  		MonoObject* InvokeMethod(MonoObject* instance, MonoMethod* method, void** params = nullptr);// 5.2 调用类的函数
  	private:
  		std::string m_ClassNamespace;
  		std::string m_ClassName;
  		MonoClass* m_MonoClass = nullptr;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "ScriptEngine.h"
  #include "ScriptGlue.h"
  
  #include "mono/jit/jit.h"
  #include "mono/metadata/assembly.h"
  #include "mono/metadata/object.h"
  #include <glm/gtc/matrix_transform.hpp>
  namespace Hazel {
      // 工具类
  	namespace Utils {
  		char* ReadBytes(const std::filesystem::path& filepath, uint32_t* outSize) {
  			std::ifstream stream(filepath, std::ios::binary | std::ios::ate);
  			if (!stream) {
  				// 打开文件失败
  				return nullptr;
  			}
  			std::streampos end = stream.tellg();
  			stream.seekg(0, std::ios::beg);
  			uint32_t size = end - stream.tellg();
  			if (size == 0) {
  				// 文件是空
  				return nullptr;
  			}
  			char* buffer = new char[size];
  			stream.read((char*)buffer, size); // 读入char字符数组中
  			stream.close();
  
  			*outSize = size; // 指针返回大小
  			return buffer;	// 返回字符数组的首位置
  		}
  		MonoAssembly* LoadCSharpAssembly(const std::filesystem::path& assemblyPath) {
  			uint32_t fileSize = 0;
  			char* fileData = ReadBytes(assemblyPath, &fileSize);
  
  			// 除了加载程序集之外，我们不能将此图像image用于任何其他用途，因为此图像没有对程序集的引用
  			MonoImageOpenStatus status;
  			MonoImage* image = mono_image_open_from_data_full(fileData, fileSize, 1, &status, 0);
  
  			if (status != MONO_IMAGE_OK) {
  				const char* erroMessage = mono_image_strerror(status);
  				// 可以打印错误信息
  				return nullptr;
  			}
  			std::string pathString = assemblyPath.string();
  			MonoAssembly* assembly = mono_assembly_load_from_full(image, pathString.c_str(), &status, 0);
  			mono_image_close(image);
  
  			// 释放内存
  			delete[] fileData;
  			return assembly;
  		}
  		void PrintAssemblyTypes(MonoAssembly* assembly) {
  			// 打印加载的c#程序的信息
  			MonoImage* image = mono_assembly_get_image(assembly);
  			const MonoTableInfo* typeDefinitionsTable = mono_image_get_table_info(image, MONO_TABLE_TYPEDEF);
  			int32_t numTypes = mono_table_info_get_rows(typeDefinitionsTable);
  
  			for (int32_t i = 0; i < numTypes; i++)
  			{
  				uint32_t cols[MONO_TYPEDEF_SIZE];
  				mono_metadata_decode_row(typeDefinitionsTable, i, cols, MONO_TYPEDEF_SIZE);
  
  				const char* nameSpace = mono_metadata_string_heap(image, cols[MONO_TYPEDEF_NAMESPACE]);
  				const char* name = mono_metadata_string_heap(image, cols[MONO_TYPEDEF_NAME]);
  
  				HZ_CORE_TRACE("{}.{}", nameSpace, name);// 命名空间和类名
  			}
  		}
  	}
  	struct ScriptEngineData {
  		MonoDomain* RootDomain = nullptr;
  		MonoDomain* AppDomain = nullptr;
  
  		MonoAssembly* CoreAssembly = nullptr;
  		MonoImage* CoreAssemblyImage = nullptr;
  		ScriptClass EntityClass;
  	};
  	static ScriptEngineData* s_Data = nullptr;
  
  	//////////////////////////////////////////////////////////////
  	// ScriptEngine////////////////////////////////////////////////
  	//////////////////////////////////////////////////////////////
      // Mono构建
  	void ScriptEngine::Init()
  	{
  		s_Data = new ScriptEngineData();
  		// 1 初始化mono
  		InitMono();
  		// 2.加载c#程序集
  		LoadAssembly("Resources/Scripts/GameEngine-ScriptCore.dll");
  
  		// 添加内部调用
  		ScriptGlue::RegisterFunctions();
  
  		// 3 创建一个MonoClass类
  		s_Data->EntityClass = ScriptClass("Hazel", "Entity");
  
  		// 4.创建一个Main类构成的mono对象并且初始化
  		MonoObject* instance = s_Data->EntityClass.Instantiate();
  
  		// 5.1调用main类的函数-无参
  		MonoMethod* printMessageFunc = s_Data->EntityClass.GetMethod("PrintMessage", 0);
  		s_Data->EntityClass.InvokeMethod(instance, printMessageFunc);
  
  		// 5.2调用main类的函数-带参
  		MonoMethod* printIntFunc = s_Data->EntityClass.GetMethod("PrintInt", 1);
  
  		int value = 5;
  		void* param = &value;
  
  		mono_runtime_invoke(printIntFunc, instance, &param, nullptr);
  
  		MonoMethod* printIntsFunc = s_Data->EntityClass.GetMethod("PrintInts", 2);
  
  		int value2 = 505;
  		void* params[2] = {
  			&value,
  			&value2
  		};
  		mono_runtime_invoke(printIntsFunc, instance, params, nullptr);
  
  		// 带string的函数
  		MonoString* monoString = mono_string_new(s_Data->AppDomain, "Hello World from cpp!");
  		MonoMethod* printCustomMessageFunc = s_Data->EntityClass.GetMethod("PrintCustomMessage", 1);
  		void* stringParam = monoString;
  		mono_runtime_invoke(printCustomMessageFunc, instance, &stringParam, nullptr);
  
  		//HZ_CORE_ASSERT(false);
  	}
  	void ScriptEngine::Shutdown()
  	{
  		ShutdownMono();
  		delete s_Data;
  	}
  	void ScriptEngine::LoadAssembly(const std::filesystem::path& filepath)
  	{
  		// 创建一个app domain
  		s_Data->AppDomain = mono_domain_create_appdomain("HazelScriptRuntime", nullptr);
  		mono_domain_set(s_Data->AppDomain, true);
  
  		// 加载c#项目导出的dll
  		s_Data->CoreAssembly = Utils::LoadCSharpAssembly(filepath);
  		s_Data->CoreAssemblyImage = mono_assembly_get_image(s_Data->CoreAssembly);
  		Utils::PrintAssemblyTypes(s_Data->CoreAssembly);// 打印dll的基本信息
  	}
  	
  	void ScriptEngine::InitMono()
  	{
  		// 设置程序集装配路径(复制的4.5版本的路径)
  		mono_set_assemblies_path("mono/lib");
  
  		MonoDomain* rootDomian = mono_jit_init("HazelJITRuntime");
  		HZ_CORE_ASSERT(rootDomian);
  
  		// 存储root domain指针
  		s_Data->RootDomain = rootDomian;
  
  	}
  	void ScriptEngine::ShutdownMono()
  	{
  		// 对mono的卸载有点迷糊，以后再解决
  		// mono_domain_unload(s_Data->AppDomain);
  		s_Data->AppDomain = nullptr;
  
  		// mono_jit_cleanup(s_Data->RootDomain);
  		s_Data->RootDomain = nullptr;
  	}
  	MonoObject* ScriptEngine::InstantiateClass(MonoClass* monoClass)
  	{
  		// 1.创建一个Main类构成的mono对象并且初始化
  		MonoObject* instance = mono_object_new(s_Data->AppDomain, monoClass);
  		mono_runtime_object_init(instance);// 构造函数在这里调用
  		return instance;
  	}
  	//////////////////////////////////////////////////////////////
  	// ScriptClass////////////////////////////////////////////////
  	//////////////////////////////////////////////////////////////
      // C#类对应的Mono类
  	ScriptClass::ScriptClass(const std::string& classNamespace, const std::string& className)
  	{
  		m_MonoClass = mono_class_from_name(s_Data->CoreAssemblyImage, classNamespace.c_str(), className.c_str());
  	}
  	MonoObject* ScriptClass::Instantiate()
  	{
  		return ScriptEngine::InstantiateClass(m_MonoClass);
  	}
  	MonoMethod* ScriptClass::GetMethod(const std::string& name, int parameterCount)
  	{		
  		return mono_class_get_method_from_name(m_MonoClass, name.c_str(), parameterCount);
  	}
  	MonoObject* ScriptClass::InvokeMethod(MonoObject* instance, MonoMethod* method, void** params)
  	{
  		return mono_runtime_invoke(method, instance, params, nullptr);// **类型，&params(实参) = params（实参）
  	}
  }
  ```

- ScriptGlue

  ```cpp
  #pragma once
  namespace Hazel {
  	class ScriptGlue
  	{
  	public:
  		static void RegisterFunctions();// 添加内部调用
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "ScriptGlue.h"
  
  #include "glm/glm.hpp"
  #include "mono/metadata/object.h"
  namespace Hazel {
  	// mono_add_internal_call("Hazel.InternalCalls::NativeLog", NativeLog);//InternalCalls是类
  	#define HZ_ADD_INTERNAL_CALL(Name) mono_add_internal_call("Hazel.InternalCalls::" #Name, Name)
  
  	static void NativeLog(MonoString* string, int parameter) {
  		char* cStr = mono_string_to_utf8(string);
  		std::string str(cStr);// 复制数据给str
  		mono_free(cStr);
  		std::cout << str << "," << parameter << std::endl;
  	}
  	static void NativeLog_Vector(glm::vec3* vec, glm::vec3* out) {
  		//HZ_CORE_WARN("Value: {0}", *vec); // 这会错的，并不支持输出向量
  		std::cout << vec->x << "," << vec->y << "," << vec->z << std::endl;
  		//*out = glm::cross(*vec, glm::vec3(vec->x, vec->y, -vec->z)); // 通过out返回指针
  		*out = glm::normalize(*vec);
  	}
  	static float NativeLog_VectorDot(glm::vec3* vec) {
  		std::cout << vec->x << "," << vec->y << "," << vec->z << std::endl;
  		return glm::dot(*vec, *vec);
  	}
  	void ScriptGlue::RegisterFunctions()
  	{
  		HZ_ADD_INTERNAL_CALL(NativeLog);// 参数对应C#、cpp同名函数名
  		HZ_ADD_INTERNAL_CALL(NativeLog_Vector);
  		HZ_ADD_INTERNAL_CALL(NativeLog_VectorDot);
  	}
  }
  ```

- C#

  ```c#
  using System;
  using System.Runtime.CompilerServices;
  
  namespace Hazel
  {
      public struct Vector3
      {
          public float X, Y, Z;
          public Vector3(float x, float y, float z)
          {
              X = x; Y = y; Z = z; 
          }
      }
      // 注意：需要是InternalCalls类名
      public static class InternalCalls
      {
          [MethodImplAttribute(MethodImplOptions.InternalCall)]
          internal extern static void NativeLog(string text, int parameter);
  
          [MethodImplAttribute(MethodImplOptions.InternalCall)]
          internal extern static void NativeLog_Vector(ref Vector3 parameter, out Vector3 result);
  
          [MethodImplAttribute(MethodImplOptions.InternalCall)]
          internal extern static float NativeLog_VectorDot(ref Vector3 parameter);
      }
      public class Entity
      {
          public float FloatVar { get; set; }
          public Entity()
          {
              Console.WriteLine("Main constructor!");
  
              // C# 调用cpp函数
              Log("liujianjie", 2023);
  
              Vector3 pos = new Vector3(5, 2.5f, 1);
              Vector3 result = Log(pos);
              Console.WriteLine($"{result.X}, {result.Y}, {result.Z}");
              Console.WriteLine("{0}", InternalCalls.NativeLog_VectorDot(ref pos));
          }
          public void PrintMessage()
          {
              Console.WriteLine("Hello World from C#!");
          }
          public void PrintInt(int value)
          {
              Console.WriteLine($"C# says: {value}");
          }
          public void PrintInts(int value1, int value2)
          {
              Console.WriteLine($"C# says: {value1} and {value2}");
          }
          public void PrintCustomMessage(string message)
          {
              Console.WriteLine($"C# says: {message}");
          }
          private void Log(string text, int parameter)
          {
              InternalCalls.NativeLog(text, parameter);
          }
          private Vector3 Log(Vector3 parameter)
          {
              InternalCalls.NativeLog_Vector(ref parameter, out Vector3 result);
              return result;
          }
      }
  }
  ```

# 涉及的C++知识

- 调用C#函数的写法

  - 普通写法

    ```cpp
    mono_runtime_invoke(printIntFunc, instance, &param, nullptr);
    ```

  - 封装成类的写法

    ```cpp
    MonoObject* ScriptClass::InvokeMethod(MonoObject* instance, MonoMethod* method, void** params)
    {
    	return mono_runtime_invoke(method, instance, params, nullptr);// **类型，&params(实参) = params（实参）
    }
    ```

  可以看到调用mono_runtime_invoke函数的第三个实参，没有像传&params(params的地址)，而是params

- 解释

  - 原因

    因为这里封装成类的params是**类型的

  - 如下

    ```cpp
    void* ps = &val;
    void** params = &ps;
    // 则
    ps指针的地址：
        &ps = params
    ```

- 指针与地址相关Demo

  ```cpp
  #include <iostream>
  using namespace std;
  
  void main() {
  	int val1 = 2;
  	int* p1 = &val1;
  	int** p2 = &p1;	
  	cout << "&val1\t"	<< &val1<< endl;// 00AFFC30		&val1是自身内存地址
  	cout << "p1\t"		<< p1	<< endl;// 00AFFC30		p1存储val1的内存位置
  	cout << "&p1\t"		<< &p1	<< endl;// 00AFFC24		&p1是自身的内存地址// 这里
  	cout << "*p1\t"		<< *p1	<< endl;// 2			*p1是所指的值
  	cout << "p2\t"		<< p2	<< endl;// 00AFFC24		p2存储p1的内存地址// 这里
  	cout << "*p2\t"		<< *p2	<< endl;// 00AFFC30		*p2是val1的地址，即等于p1存储val1的内存位置
  	cout << "**p2\t"	<< **p2 << endl;// 2			**p2是val1的值
  	cout << "&p2\t"		<< &p2 << endl; // 00AFFC18		&p2是p2自身的内存地址
  	/*
  		val1的内存地址
  			&val1 = p1 = *p2
  		val1的值
  			val1 = *p1 = **p2
  		p1指针的地址
  			&p1 = p2
  	*/
  }
  ```

  

