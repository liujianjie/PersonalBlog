> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  将C#游戏代码作为新工作空间的项目，并**引用**C#核心库的项目

  - 1个C#核心库项目

  - 1个C#脚本项目

    里面脚本调用C#核心库的函数，从而实现脚本功能

  像Unity开发时，Unity有一套自己的dll，我们写脚本需要using UnityEngine;，调用Unity库dll才能实现相应效果

- 如何实现

  使用premake5快速制作

- 实现细节

  - 当分离了C#游戏代码和核心库代码，那C++加载dll从一个变成两个

  - 得到C# dll的Mono类

    应该**区分**是获取C#核心库程序集的 Mono类

    还是获取C#应用程序集的 Mono类

# 项目结构相关

## 新的工作空间新脚本项目

- 新的工作空间文件路径

  在GameEngine-Editor编辑器项目下

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125772.png)

- 新Sandbox脚本项目的premake

  ```c++
  local UnifyRootDir = "../../../.."
  
  workspace "Sandbox"
  	architecture "x86_64"
  	startproject "Sandbox"
  	configurations{
  		"Debug",
  		"Release",
  		"Dist"
  	}
  	flags{
  		"MultiProcessorCompile"
  	}
  
  outputdir = "%{cfg.buildcfg}-%{cfg.system}-%{cfg.architecture}"
  
  project "Sandbox"
  	kind "SharedLib"
  	language "C#"
  	dotnetframework "4.7.2"
  
  	targetdir ("Binaries")
  	objdir ("Intermediates")
  
  	files{
  		"Source/**.cs",
  		"Properies/**.cs"
  	}
  	links{
  		"GameEngine-ScriptCore"
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
  
  group "Unify"
  	include (UnifyRootDir .. "/GameEngine-ScriptCore")
  group ""
  ```

## 新Sandbox脚本项目结构

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125777.png)

- Sandbox项目引用GameEngine-ScriptCore项目
- Sandbox项目包含从GameEngine-ScriptCore项目移动过来的Player.cs游戏逻辑脚本代码

## 新Sanbox脚本项目生成dll

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132126261.png)

- 由premake设置的生成目录

  ```c++
  targetdir ("Binaries")
  objdir ("Intermediates")
  ```

- 由于Sandbox项目引用GameEngine-ScriptCore项目

  所以生成**不仅会生成Sandbox.dll也会生成GameEngine-ScriptCore.dll**

# 项目代码改变

项目代码所做的改变都是为了**加载两个dll**，和根据不同dll**反射不同的类**

ScriptEngine.h

```c++
//ScriptClass(const std::string& classNamespace, const std::string& className);
ScriptClass(const std::string& classNamespace, const std::string& className, bool isCore = false);
static void LoadAppAssembly(const std::filesystem::path& filepath);
//static void LoadAssemblyClasses(MonoAssembly* assembly);
static void LoadAssemblyClasses();
```

ScriptEngine.cpp

```c++
struct ScriptEngineData {
    MonoAssembly* CoreAssembly = nullptr;
    MonoImage* CoreAssemblyImage = nullptr;
	// 新增，因加载脚本dll，需保存这两个
    MonoAssembly* AppAssembly = nullptr;
    MonoImage* AppAssemblyImage = nullptr;
};
LoadAssembly("Resources/Scripts/Hazel-ScriptCore.dll");
LoadAppAssembly("SandboxProject/Assets/Scripts/Binaries/Sandbox.dll");
s_Data->EntityClass = ScriptClass("Hazel", "Entity", true);

void ScriptEngine::LoadAssemblyClasses()
{
    // Entity类在核心库
    MonoClass* entityClass = mono_class_from_name(s_Data->CoreAssemblyImage, "Hazel", "Entity");
    // 从游戏逻辑脚本库里加载脚本类
    const char* nameSpace = mono_metadata_string_heap(s_Data->AppAssemblyImage, cols[MONO_TYPEDEF_NAMESPACE]);
    const char* name = mono_metadata_string_heap(s_Data->AppAssemblyImage, cols[MONO_TYPEDEF_NAME]);
	MonoClass* monoClass = mono_class_from_name(s_Data->AppAssemblyImage, nameSpace, name);
}
void ScriptEngine::LoadAppAssembly(const std::filesystem::path& filepath)
{
    // Move this maybe
    s_Data->AppAssembly = Utils::LoadMonoAssembly(filepath);
    auto assemb = s_Data->AppAssembly;
    s_Data->AppAssemblyImage = mono_assembly_get_image(s_Data->AppAssembly);
    auto assembi = s_Data->AppAssemblyImage;
    // Utils::PrintAssemblyTypes(s_Data->AppAssembly);
}
ScriptClass::ScriptClass(const std::string& classNamespace, const std::string& className, bool isCore)
    : m_ClassNamespace(classNamespace), m_ClassName(className)
{
    /*
    得到C# dll的Mono类
    应该**区分**是获取C#核心库程序集的 Mono类
    还是获取C#应用程序集的 Mono类
    */
   m_MonoClass = mono_class_from_name(s_Data->CoreAssemblyImage, classNamespace.c_str(), className.c_str());
   m_MonoClass = mono_class_from_name(isCore ? s_Data->CoreAssemblyImage : s_Data->AppAssemblyImage, classNamespace.c_str(), className.c_str());
}
```

# 遇到的Bug

- GameEngine-ScriptCore.dll无法加载

  GameEngine-ScriptCore.dll**生成**在GameEngine-Editor\SandboxProject\Assets\Scripts\Binaries文件夹下

  而不是在GameEngine-Editor\Resources\Scripts文件夹下

  - 原因

    新Sandbox项目包含引用了GameEngine-ScriptCore项目

    而Sandbox的premake写的生成文件路径为

    ```c++
    targetdir ("Binaries")
    objdir ("Intermediates")
    ```

    而GameEngine-ScriptCore的premake又写的是

    ```c++
    targetdir ("%{wks.location}/GameEngine-Editor/Resources/Scripts")
    objdir ("%{wks.location}/GameEngine-Editor/Resources/Scripts/Intermediates")
    ```

    注意%{wks.location}这个代码，它获取的是**.sln**的所在位置

    - 原先GameEngineLightWeight工作空间包含它

      %{wks.location} = GameEngineLightWeight

      所以生成目录为:

      GameEngineLightWeight\GameEngine-Editor\Resources\Scripts

    - 但是新**Sandbox也有自己的新的工作空间**，并且也包含了这个GameEngine-ScriptCore项目

      %{wks.location} = **GameEngineLightWeight\GameEngine-Editor\SandboxProject\Assets\Scripts**

      所以这生成目录变成为：

      GameEngineLightWeight\GameEngine-Editor\SandboxProject\Assets\Scripts\GameEngine-Editor\Resources\Scripts

  - 如下生成路径

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125778.png)

    生成的路径与代码加载dll的路径不同，所以会报错

  - 如何解决

    在GameEngine-ScriptCore项目的premake中**修改生成路径**

    ```c++
    -- 获取的是.sln所在的位置
    --targetdir ("%{wks.location}/GameEngine-Editor/Resources/Scripts")
    --objdir ("%{wks.location}/GameEngine-Editor/Resources/Scripts/Intermediates")
    targetdir ("../GameEngine-Editor/Resources/Scripts")
    objdir ("../GameEngine-Editor/Resources/Scripts/Intermediates")
    ```

    由../代替%{wks.location}

  - 重新生成路径

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308132125793.png)

