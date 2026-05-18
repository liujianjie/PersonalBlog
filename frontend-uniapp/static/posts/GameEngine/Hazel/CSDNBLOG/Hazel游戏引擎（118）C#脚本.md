> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  hazel实现能cpp能调用C#的函数（C#语言嵌入cpp中），需要安装mono.Net库，并克隆git上的mono项目自己构建导出mono库。

  即：**需要.Net库和构建的mono库**

- Cherno所做

  用visual studio**构建mono项目导出mono静态库**，静态链接，而不是像peter一样使用mono安装路径下文件夹下已有的mono库。

  （为什么要静态库，因为当前引擎就是用静态链接）

- 相关链接

  Peter的讲解[mono](https://github.com/peter1745/peter1745.github.io/blob/main/public/mono-guide/src/SUMMARY.md)

# 必要：安装mono.Net库

- [网址](https://www.mono-project.com/download/stable/)

  默认安装在c盘

- 如下

  ![image-20230812181244618](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132122795.png)

- 这个安装目录

  - 有在下面 **可选：生成静态库步骤**中对应生成的两个东西

    1. libmono-static-sgen.lib文件
    2. libmono-static-sgen.lib文件（函数定义）对应的头文件（函数声明）（在include文件内）

  - 有能够实现cpp脚本调用C#脚本的 .Net4.5版本的**程序集和库**

    .NET Framework版本的程序集和库，这是因为Mono的主要目的是为了在非Windows平台上实现.NET Framework的兼容性，所以安装mono.Net库自带各个版本的.NET Framework版本程序集和库

# 可选：源项目生成静态库步骤

- 这节目的
  1. 生成静态库：libmono-static-sgen.lib文件
  2. 得到libmono-static-sgen.lib库的使用到的**头文件类**
- 而在Mono的安装目录下**包含了**这节所需的这两个，所以
  - 这步是可选的，可以**直接复制**Mono安装目录下的东西
  - 这步哪部分运行失败的情况下，可以**直接复制**Mono安装目录下的部分

## 克隆mono开源项目

- 克隆mono开源项目

  ```
  git clone --recursive https://github.com/mono/mono
  ```

  - Tips

  1. --recursive是会克隆Mono的子模块
    2. 如果克隆过程中卡顿，参考本节末尾的做法 

- 回退版本

  clone好后将版本退回Cherno当时下载时候，稳定的的tag版本

  ```cpp
  git checkout 6051b71 // 这是cherno当时使用时候的Tag版本，选择这个好
  ```

  ![image-20230812210750245](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132122921.png)

## 生成静态库

- 打开mono开源项目下的sln文件

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132122954.png)

  

- 生成libmono-static-sgen.lib文件（函数的定义）

  打开后对libmono-static**单个项目**进行生成

  注意选择：debug 64

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130018501.png)

  另外：release 64 也要生成一次

- 生成libmono-static-sgen.lib文件中函数定义的**头文件**（函数声明）

  - 方法一：**全部项目都生成一次**(原视频40:33处)。**此方法不好**

    1. 操作方式一：按shift+ctrl+b

    2. 操作方式二：若shift+ctrl+b**无反应**，则按以下按钮

       ![image-20230812212355362](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130018429.png)

    但是报以下错

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132122067.png)

    报缺少jit.h头文件，我就把Mono**安装目录**下的include\mono-2.0\mono\jit\jit.h头文件放到，Mono开源项目的mono\mono文件夹下，需重启Visual Studio

    ![image-20230812212018774](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132121553.png)

    再重新全部生成解决方案，就可以了。

    如果依旧不行，请参考方法2

  - 方法二：我的操作

    1. 右键libmono-**dynamic**项目（注意是libmono-**dynamic**项目，而不是libmono-static项目）
    2. 进行重新生成

    ![image-20230812213831524](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132121737.png)

  - 方法三：

    直接使用Mono安装目录下**include**的文件夹

  - 若成功

    在build下有include文件夹

    ![image-20230812213217115](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132121529.png)

  - 解释方法一方法二所做的原因

    - 图示

      ![image-20230812211105750](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019836.png)

    - 解释

      在libmono-**dynamic**项目中有一个生成后的事件，这个命令就是把指定目录下的头文件复制到include文件夹下。

      方法一是全部项目生成，所以当libmono-**dynamic**项目编译生成，就会拷贝头文件

      方法二是单个项目生成，当libmono-**dynamic**项目编译生成成功，自然也会拷贝头文件

## 移动生成的库文件与inlcude文件

- 1.将include/mono文件夹放入引擎下的vendor/mono/include下（函数声明）

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019142.png)

- 2.拷贝生成的mono库文件到vender/mono下（函数定义）

  源

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019309.png)

  目标点

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019611.png)

# 项目修改

## 移动Mono安装目录里的.Net库文件

- 具体步骤

  到mono安装目录下，找到4.5版本的文件夹移动到编辑器下。

  - 源

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132121058.png)

  - 目标

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019967.png)

- 为什么要4.5版本的.Net库

  因为加载C#程序集需用这里的库。在下面会写到这样的代码，对应这步操作

  ```cpp
  // 设置程序集装配路径(复制的4.5版本的路径)
  mono_set_assemblies_path("mono/lib");
  ```

- 为什么要4.5版

  peter在GitHub的md文件说4.5版本支持类似**热更新**东西。

## 修改项目的premake文件

- 新增GameEngine-ScriptCore项目的premake文件：C#项目

  ```lua
  project "GameEngine-ScriptCore"
  	kind "SharedLib"
  	language "C#"-- C#项目
  	dotnetframework "4.7.2"
  
  	-- 生成的目标位置
  	targetdir ("%{wks.location}/GameEngine-Editor/Resources/Scripts")
  	objdir ("%{wks.location}/GameEngine-Editor/Resources/Scripts/Intermediates")
  
  	files{
  		"Source/**.cs",
  		"Properties/**.cs"
  	}
  
  	filter "configurations:Debug"
  		optimize "Off"
  		symbols "Default"
  
  	filter "configurations:Release"
  		optimize "On"
  		symbols "Default"
  
  	filter "configurations:Dist"
  		optimize "Full"
  		symbols "Off"
  ```

- 主premake文件

  引入上面GitHub下载mono项目并**生成的文件**

  ```lua
  .......
  IncludeDir["mono"] = "GameEngineLightWeight/vendor/mono/include"
  -- %{wks.location}获取当前项目.sln的路径E:\AllWorkSpace1\GameEngineLightWeight
  -- %{cfg.buildcfg}表示当前编译目标是Debug还是Release
  LibraryDir["mono"] = "%{wks.location}/GameEngineLightWeight/vendor/mono/lib/%{cfg.buildcfg}" 
  Library = {}
  -------------------------------------------------------------------
  Library["mono"] = "%{LibraryDir.mono}/libmono-static-sgen.lib" -- 主要是这个
  
  -- Windows
  Library["WinSock"] = "Ws2_32.lib"
  Library["WinMM"] = "Winmm.lib"
  Library["WinVersion"] = "Version.lib"
  Library["BCrypt"] = "Bcrypt.lib"
  project "GameEngineLightWeight"
  	links{
  		"GLFW",
  		"Glad",
  		"ImGui",
  		"yaml-cpp",
  		"opengl32.lib",
  		"Box2D",
  		"%{Library.mono}"
  	}
      filter "system:windows"
  		systemversion "latest"
  		links{
  			"%{Library.WinSock}",
  			"%{Library.WinMM}",
  			"%{Library.WinVersion}",
  			"%{Library.BCrypt}",
  		}
  .......
  ```

## 写脚本引擎代码: Cpp调用C#函数

- 在GameEngine-ScriptCore项目中

  写好要嵌入cpp中的类

  ```c#
  using System;
  
  namespace Hazel
  {
      public class Main
      {
          public float FloatVar { get; set; }
          public Main()
          {
              Console.WriteLine("Main constructor!");
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
      }
  }
  ```

  生成会导出dll到GameEngine-Editor目录下

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132121798.png)

- 在GameEngineLightWeight项目中

  写好初始化mono环境，加载C#项目生成的 dll

  ```cpp
  #include "hzpch.h"
  #include "ScriptEngine.h"
  #include "mono/jit/jit.h"
  #include "mono/metadata/assembly.h"
  #include "mono/metadata/object.h"
  namespace Hazel {
  	struct ScriptEngineData {
  		MonoDomain* RootDomain = nullptr;
  		MonoDomain* AppDomain = nullptr;
  
  		MonoAssembly* CoreAssembly = nullptr;
  	};
  	static ScriptEngineData* s_Data = nullptr;
  	void ScriptEngine::Init(){
  		s_Data = new ScriptEngineData();
  		InitMono();
  	}
  	void ScriptEngine::Shutdown(){
  		ShutdownMono();
  		delete s_Data;
  	}
  	char* ReadBytes(const std::string& filepath, uint32_t* outSize) {
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
  	MonoAssembly* LoadCSharpAssembly(const std::string& assemblyPath) {
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
  		MonoAssembly* assembly = mono_assembly_load_from_full(image, assemblyPath.c_str(), &status, 0);
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
      void ScriptEngine::InitMono(){
          /////////////////////////////////////////////////////////////////
          // 设置程序集装配路径(复制的4.5版本的路径)
          mono_set_assemblies_path("mono/lib");
  
          MonoDomain* rootDomian = mono_jit_init("HazelJITRuntime");
          HZ_CORE_ASSERT(rootDomian);
  
          // 存储root domain指针
          s_Data->RootDomain = rootDomian;
  
          // 创建一个app domain
          s_Data->AppDomain = mono_domain_create_appdomain("HazelScriptRuntime", nullptr);
          mono_domain_set(s_Data->AppDomain, true);
  
          // 加载c#项目导出的dll
          s_Data->CoreAssembly = LoadCSharpAssembly("Resources/Scripts/GameEngine-ScriptCore.dll");
          PrintAssemblyTypes(s_Data->CoreAssembly);// 打印dll的基本信息
  
          MonoImage* assemblyImage = mono_assembly_get_image(s_Data->CoreAssembly);
          MonoClass* monoClass = mono_class_from_name(assemblyImage, "Hazel", "Main");
  
          // 1.创建一个Main类构成的mono对象并且初始化
          MonoObject* instance = mono_object_new(s_Data->AppDomain, monoClass);
          mono_runtime_object_init(instance);
  
          // 2. 调用main类的函数-无参
          MonoMethod* printMessageFunc = mono_class_get_method_from_name(monoClass, "PrintMessage", 0);
          mono_runtime_invoke(printMessageFunc, instance, nullptr, nullptr);
  
          // 3.调用main类的函数-带参
          MonoMethod* printIntFunc = mono_class_get_method_from_name(monoClass, "PrintInt", 1);
  
          int value = 5;
          void* param = &value;
  
          mono_runtime_invoke(printIntFunc, instance, &param, nullptr);
  
          MonoMethod* printIntsFunc = mono_class_get_method_from_name(monoClass, "PrintInts", 2);
  
          int value2 = 505;
          void* params[2] = {
              &value,
              &value2
          };
          mono_runtime_invoke(printIntsFunc, instance, params, nullptr);
  
          // 带string的函数
          MonoString* monoString = mono_string_new(s_Data->AppDomain, "Hello World from cpp!");
          MonoMethod* printCustomMessageFunc = mono_class_get_method_from_name(monoClass, "PrintCustomMessage", 1);
          void* stringParam = monoString;
          mono_runtime_invoke(printCustomMessageFunc, instance, &stringParam, nullptr);
      }
  	void ScriptEngine::ShutdownMono(){
  		// 对mono的卸载有点迷糊，以后再解决
  		// mono_domain_unload(s_Data->AppDomain);
  		s_Data->AppDomain = nullptr;
  
  		// mono_jit_cleanup(s_Data->RootDomain);
  		s_Data->RootDomain = nullptr;
  	}
  }
  ```

## 编译

### 编译成功（效果）

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019942.png)

即完成在cpp中调用c#的函数

### Cherno遇到的Bug

- Bug说明 缺少的静态库

  报错信息

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019006.png)

- Cherno的解决方法

  番茄助手alt-shift-s,搜索mono_wi32socket_

  进入**w32socket.c**文件

  找到有bind方法

  谷歌：WinSock bind进入microsoft learn会有说这个bind函数要什么库

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132121339.png)

  将这个库写入Hazel的premake中

  ```cpp
  links
  {
      "Ws2_32.lib"
  }
  ```

   链接了这个Ws2_32.lib，再编译还是会报错：缺少的静态库，依次按以上步骤，需链接以下的库

  ```cpp
  -- Windows
  Library["WinSock"] = "Ws2_32.lib"
  Library["WinMM"] = "Winmm.lib"
  Library["WinVersion"] = "Version.lib"
  Library["BCrypt"] = "Bcrypt.lib"
  links
  {
      "%{Library.WinSock}",
      "%{Library.WinMM}",
      "%{Library.WinVersion}",
      "%{Library.BCrypt}",
  }
  ```

    再编译即可成功

### 我遇到的bug

- Bug解释

  无法解析的外部符号 mono_amd64_desc、mono_amd64_desc_idx

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019415.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019530.png)

- 解决方法

  没有好的解决方法，就把Mono安装目录下的libmono-static-sgen.lib文件拷贝过来覆盖vendor\mono\lib\Debug(Release)文件夹下的静态文件。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130019738.png)

  （debug和realease这两个文件夹下除了libmono-static-sgen.lib其它文件都可以删除）

  所以猜测是下载的mono项目生成的问题，也许没有切换好的tag或者其它一些小问题。

# 扩展阅读：项目生成的动态与静态库

以Mono开源库为例

- 动态库

  - 项目libmono-dynamic

    ![image-20230812215440262](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130020647.png)

    目标名是mono-2.0-sgen

  - 这个项目会生成**两个文件**

    1. mono-2.0-sgen.dll  大

       ![image-20230812215726598](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130020126.png)

       10MB

    2. mono-2.0-sgen.lib  小

       ![image-20230812215754375](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130020869.png)

       274kb

  - 相关解释：为什么**会有两个文件**，且**大小不一**

    1. mono-2.0-sgen.lib文件会融入到Exe应用程序里，这个lib文件存储的是函数定义在dll中的**位置**

       所以更小

    2. mono-2.0-sgen.dll文件，当Exe应用程序启动时，将dll加载到内存CPU中再链接，存储的是函数定义

       所以更大

- 静态

  - 项目libmono-static

    ![image-20230812220259429](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130020131.png)

  - 这个项目只会生成一个lib文件

    ![image-20230812220341625](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132122406.png)

    40MB，大于动态库生成的lib文件

  - 相关解释：为什么只有一个文件

    **只需一个lib**文件存储函数的定义

    当项目引用一个静态库（例如a.lib）时，编译器和链接器会将实际用到的函数和数据合并到生成的可执行文件（exe）中，所以造成的Exe应用程序比较大。

# 扩展阅读：克隆Mono项目加速测试

克隆mono开源项目（正确的做法是第4钟）

- 法一：普通命令

  ```
  git clone --recursive https://github.com/mono/mono
  ```

  很卡

  (--recursive是会克隆Mono的子模块)

- 法二：使用**gitee**镜像，再用如上的克隆命令

  ```
  git clone --recursive https://gitee.com/frankluna/mono
  ```

  下载子模块照样卡

- 法三：使用油猴插件，添加[GitHub加速脚本](https://greasyfork.org/zh-CN/scripts/412245-github-%E5%A2%9E%E5%BC%BA-%E9%AB%98%E9%80%9F%E4%B8%8B%E8%BD%BD)

  ![](https://s2.loli.net/2023/02/07/fHTSN5uhLAmVpsc.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132122449.png)

  git clone --recursive https://github.91chi.fun//https://github.com/mono/mono.git

  照样卡，还有时无效

- 法四：使用梯子的端口，快

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130034881.png)

  

  ```
  git config --global http.https://github.com.proxy socks5://127.0.0.1:7890
  git clone --recursive https://github.com/mono/mono
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130033161.png)

  ```
  下次不用可以取消梯子的代理
  git config --global --unset http.proxy 
  git config --global --unset https.proxy
  ```

