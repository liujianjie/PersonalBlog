> 本人菜鸟，文中若有代码、术语等错误，欢迎指正

我写的项目地址：https://github.com/liujianjie/GameEngineLightWeight（中文的注释适合中国人的你）

[toc]

# 前言

- 此节目的

  为了实现项目能在控制台打印日志信息，不是简单字符串输出，更要有C#语言风格的输出，能接收参数这些

- 如何实现

  自己写好的日志API，得1千左右行，应使用第三方日志库
  
  https://github.com/gabime/spdlog

# 步骤相关

## Git添加子模块

- cmd

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161054190.png)

  ```cpp
  git submodule add https://github.com/gabime/spdlog hazel/vendor/spdlog
  ```

  hazel/vendor/spdlog是本地存储路径

- .gitmodules文件里存储子模块信息

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161055170.png)

- 添加后本地文件

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161054638.png)

## 项目属性修改

- 给Hazel包含spdlog的目录，以便能include spdlog的头文件

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161056761.png)

- Sandbox项目也要包含spdlog的目录

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161058533.png)

  为什么Sandbox项目也要?

  因为如上一节入口点所讲，Sandbox包含了Hazel的头文件，而Hazel的头文件引入了spdlog的头文件，代表Sandbox**也引入**了spdlog的头文件，所以也要包含，不然会报找不到文件的错误。

## 代码相关

- 新建Log类

  h头文件

  ```cpp
  #pragma once
  #include <memory>
  #include "Core.h"
  #include "spdlog/spdlog.h"
  namespace Hazel {
  	class HAZEL_API Log{
  	public:
  		static void Init();// 初始化
          // 向外提供获取日志对象
  		inline static std::shared_ptr<spdlog::logger>& GetCoreLogger() { return s_CoreLogger; }
  		inline static std::shared_ptr<spdlog::logger>& GetClientLogger() { return s_ClientLogger; }
  	private:
  		static std::shared_ptr<spdlog::logger> s_CoreLogger;// Hazel项目的日志对象
  		static std::shared_ptr<spdlog::logger> s_ClientLogger;// Sandbox项目的日志对象
  	};
  }
  
  // Core log macros
  // ...是接受函数参数包，__VA_ARGS__转发函数参数包
  #define HZ_CORE_TRACE(...)    ::Hazel::Log::GetCoreLogger()->trace(__VA_ARGS__)
  #define HZ_CORE_INFO(...)     ::Hazel::Log::GetCoreLogger()->info(__VA_ARGS__)
  #define HZ_CORE_WARN(...)     ::Hazel::Log::GetCoreLogger()->warn(__VA_ARGS__)
  #define HZ_CORE_ERROR(...)    ::Hazel::Log::GetCoreLogger()->error(__VA_ARGS__)
  //#define HZ_CORE_FATAL(...)    ::Hazel::Log::GetCoreLogger()->fatal(__VA_ARGS__) 
  
  // Client log macros
  #define HZ_TRACE(...)	      ::Hazel::Log::GetClientLogger()->trace(__VA_ARGS__)
  #define HZ_INFO(...)	      ::Hazel::Log::GetClientLogger()->info(__VA_ARGS__)
  #define HZ_WARN(...)	      ::Hazel::Log::GetClientLogger()->warn(__VA_ARGS__)
  #define HZ_ERROR(...)	      ::Hazel::Log::GetClientLogger()->error(__VA_ARGS__)
  //#define HZ_FATAL(...)	      ::Hazel::Log::GetClientLogger()->fatal(__VA_ARGS__)
  ```

  将日志对象用shared_ptr智能指针自动管理，静态的表示唯一

  cpp文件

  ```cpp
  #include "Log.h"
  #include "spdlog/sinks/stdout_color_sinks.h"
  
  namespace Hazel {
  	// 由于这两属性是静态的，得在cpp里定义，不然报无法解析的外部符号错误
  	std::shared_ptr<spdlog::logger> Log::s_CoreLogger;
  	std::shared_ptr<spdlog::logger> Log::s_ClientLogger;
  	void Log::Init()
  	{
  		// 自定义日志格式：%^颜色起始点、%T时间戳(HH:MM:SS)、%n记录员的名字、%v实际的文本、%$颜色结束点
  		spdlog::set_pattern("%^[%T] %n: %v%$");
  		s_CoreLogger = spdlog::stdout_color_mt("HAZEL");// HAZEL 对应自定义格式的%n
  		s_CoreLogger->set_level(spdlog::level::trace);
  
  		s_ClientLogger = spdlog::stdout_color_mt("APP");// APP 对应自定义格式的%n
  		s_ClientLogger->set_level(spdlog::level::trace);
  	}
  }
  ```

  关于自定义日志格式，可上spdlog库的wiki查看

  https://github.com/gabime/spdlog/wiki/3.-Custom-formatting

- EntryPoint.h

  入口点main函数里输出日志

  ```cpp
  #pragma once
  #ifdef HZ_PLATFORM_WINDOWS
  extern Hazel::Application* Hazel::CreateApplication();
  int main(int argc, char** argv){
  	Hazel::Log::Init();
  	// 原本代码输出日志
  	Hazel::Log::GetCoreLogger()->warn("原始代码输出日志");
  	Hazel::Log::GetClientLogger()->error("原始代码输出日志");
  
  	// 用宏定义，输出日志
  	HZ_CORE_WARN("Initialized Log!");
  	int a = 5;
  	HZ_INFO("Hello! Var={0}", a);
  
  	auto app = Hazel::CreateApplication();
  	app->Run();
  	delete app;
  }
  #endif
  ```

## 代码流程

005节已经写了代码流程，但这里再重复一遍，以保本文逻辑通畅

- 开始运行Sandbox.exe

  由于Sandbox中#include <Hazel.h>，而Hazel项目的Hazel.h**包含**了Log.h、Application.h和EntryPoint.h入口文件

  Hazel.h

  ```cpp
  #pragma once
  // For use by Hazel applications
  #include "Hazel/Log.h"
  #include "Hazel/Application.h"
  // ---Entry Point---------------------
  #include "Hazel/EntryPoint.h"
  // -----------------------------------
  ```

- 所以Log.h、Application.h、EntryPoint.h的头文件内容都会被拷贝到#include <Hazel.h>处

  当sandbox.exe运行，执行在EntryPoint.h的main函数，main函数里如上一小点的代码输出了日志

- 输出效果如下

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161111208.png)



# Git删除子模块

因添加子模块时候，写错代码，导致子模块添加路径错误，需要删除子模块并重新添加。而删除子模块是个稍微麻烦的事，网上查阅后，在此记录一下

## 1. 删除submodule缓存

**需要先暂存 .gitmodules 文件**, 否则会报错: fatal: please stage your changes to .gitmodules or stash them to proceed

```cpp
git add .gitmodules
git rm --cached submodule_name 
// git rm --cached hazel\vendor\spdlog
```

若报什么index已经存在的错误，说明没有执行git rm --cached 命令。

若报什么please stage your changes to .gitmodules or stash them to proceed，说明没有执行git add .gitmodules命令

## 2. 删除submodule目录

可以手动删除，也可以如下命令删除，注意自己电脑是windows还是linux系统

```cpp
rmdir /s PATH\TO\FOLDER-NAME// rmdir是windows命令，注意是反斜杠的目录
// rmdir /s hazel\vendor\spdlog
```

## 3. 修改.gitmodules

```cpp
移除对应的submodule信息, 只有1个submodule信息的时候也可以删除该文件.
```

![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161121253.png)

## 4. .git/modules

移除对应的submodule目录

进入.git\modules\hazel\vendor，删除对应的子模块文件夹

![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161121954.png)

## 5. .git/config

移除对应的submodule目录

![](https://raw.githubusercontent.com/liujianjie/Image/main/CSDNBlogImg/202302161121252.png)

