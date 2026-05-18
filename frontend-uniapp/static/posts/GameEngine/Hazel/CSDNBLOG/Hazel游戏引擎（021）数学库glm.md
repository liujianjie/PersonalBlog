> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了渲染需要数学运算，自己写数学运算功能可以，但写好写得运算快难。

  （写好数学运算需要用SIMD，知识盲区）

  而GLM数学库已经写好了数学运算且支持SIMD使得运算更快。

- 相关网址

  https://glm.g-truc.net/0.9.9/index.html

  https://github.com/g-truc/glm

# 项目相关

## 包含GLM

- 添加子模块

  ```cpp
  git submodule add https://github.com/g-truc/glm Hazel/vendor/glm
  ```

- 修改解决方案下的premake

  glm使用hpp文件，函数声明与定义都写在同一个hpp文件中，所以**不需要作为项目**编译cpp成obj文件打包成lib文件，被Hazel引用找到使用的函数的定义，只需包含目录就行（待验证）

  ```cpp
  -- 包含相对解决方案的目录
  IncludeDir = {}
  IncludeDir["GLFW"] = "Hazel/vendor/GLFW/include"
  IncludeDir["Glad"] = "Hazel/vendor/Glad/include"
  IncludeDir["ImGui"] = "Hazel/vendor/imgui"
  IncludeDir["glm"] = "Hazel/vendor/glm"
  
  include "Hazel/vendor/GLFW"
  include "Hazel/vendor/Glad"
  include "Hazel/vendor/imgui"
      
  project "Hazel"		--Hazel项目
  	......
  	-- 包含的所有h和cpp文件
  	files{
  		"%{prj.name}/src/**.h",
  		"%{prj.name}/src/**.cpp",
      	-- 可以不用包含hpp文件
  		"%{prj.name}/vendor/glm/glm/**.hpp",
  		"%{prj.name}/vendor/glm/glm/**.inl"
  	}
  	-- 包含目录
  	includedirs{
  		"%{prj.name}/src",
  		"%{prj.name}/vendor/spdlog/include",
  		"%{IncludeDir.GLFW}",
  		"%{IncludeDir.Glad}",
  		"%{IncludeDir.ImGui}",
  		"%{IncludeDir.glm}"-- 包含目录
  	}
  project "Sandbox"
  	.....
  	includedirs{
  		"Hazel/vendor/spdlog/include",
  		"Hazel/src",
  		"%{IncludeDir.glm}"
  	}
  ```

## 测试效果

- SandboxApp.cpp

  ```cpp
  #include <Hazel.h>
  
  #include <glm/vec3.hpp> // glm::vec3
  #include <glm/vec4.hpp> // glm::vec4
  #include <glm/mat4x4.hpp> // glm::mat4
  #include <glm/gtc/matrix_transform.hpp> // glm::translate, glm::rotate, glm::scale, glm::perspective
  glm::mat4 camera(float Translate, glm::vec2 const& Rotate)
  {
  	glm::mat4 Projection = glm::perspective(glm::radians(45.0f), 4.0f / 3.0f, 0.1f, 100.f);
  	glm::mat4 View = glm::translate(glm::mat4(1.0f), glm::vec3(0.0f, 0.0f, -Translate));
  	View = glm::rotate(View, Rotate.y, glm::vec3(-1.0f, 0.0f, 0.0f));
  	View = glm::rotate(View, Rotate.x, glm::vec3(0.0f, 1.0f, 0.0f));
  	glm::mat4 Model = glm::scale(glm::mat4(1.0f), glm::vec3(0.5f));
  	return Projection * View * Model;
  }
  class ExampleLayer : public Hazel::Layer
  {
  public:
  	ExampleLayer()
  		: Layer("Example")
  	{
  		camera(3.0f, { 2.0f, 1.0f });
  	}
  ```

  ![](../图片/021.GLM/测试效果.png)