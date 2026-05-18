> 文中若有代码、术语等错误，欢迎指正

[toc]

# 049维护

软件工程就是一个不断迭代更新的过程，所以这次需要

1. 将项目从vs2017更新到vs2019

   Win-GenProjects.bat

   ```cpp
   @echo off
   e:
   cd E:\AllWorkSpace1\GameEngineLightWeight\scripts
   pushd ..\
   call vendor\bin\premake\premake5.exe vs2019
   popd
   PAUSE
   ```

2. 整理项目文件夹

3. 测试Release版本是否有效



# 050预备在SandBox封装2D渲染

## 前言

- 此节所做

  将Sandbox项目中的ExampleLayer渲染代码**移到**在Sandbox项目中新创建的SandBox2D(Layer)类中。

  在SandBox2D类中**调用**Hazel项目中的OpenGL渲染类。

## 遇到的Bug

- Bug1

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231819143.png)

  由于Hazel.h中#include "Hazel/Core/EntryPoint.h",

  在SandboxApp中#include "Hazel.h"了

  但Sandbox2D中又#include "Hazel.h"了

  在EntryPoint.h中

  ```c++
  #pragma once
  
  #ifdef  HZ_PLATFORM_WINDOWS
  
  extern Hazel::Application* Hazel::CreateApplication();
  
  int main(int argc, char** argv) {
  	Hazel::Log::Init();
  	HZ_CORE_WARN("Initialized Log!");
  	int a = 5;
  	HZ_INFO("Hello! Var={0}", a);
  
  	auto app = Hazel::CreateApplication();
  	app->Run();
  	delete app;
  }
  
  #endif //  HZ_PLATFORM_WINDOWS
  
  ```

  具有main函数的定义，这样的话SandboxApp与Sandbox2D中**都有一份**main函数的定义

  所以会报main已经定义

- Bug2

  - 原先Examplayer的shader与上传Uniform的代码是

    ```cpp
    std::string flatShaderfragmentSrc = R"(
    #version 330 core
    
    layout(location = 0) out vec4 color;
    
    in vec3 v_Position;
    
    uniform vec3 u_Color;
    
    void main(){
    color = vec4(u_Color, 1.0f);	
    }			
    )";
    std::dynamic_pointer_cast<Hazel::OpenGLShader>(m_FlatShader)->UploadUniformFloat3("u_Color", m_SquareColor);
    ```

  - 而移到FlatColor.glsl代码变为

    ```cpp
    #type fragment
    #version 330 core
    
    layout(location = 0) out vec4 color;
    
    uniform vec4 u_Color;
    
    void main() {
    	color = u_Color;	
    }
    ```

    这里u_Color是vec4，而如果还用原来的UploadUniformFloat3，使得，u_Color的第四位为0，从而显示不出图形

## 代码修改

Sandbox2D

```c++
#pragma once
#include "Hazel.h"

class Sandbox2D :public Hazel::Layer
{
public:
	Sandbox2D();
	virtual ~Sandbox2D();
	virtual void OnAttach() override;
	virtual void OnDetach()override;

	virtual void OnUpdate(Hazel::Timestep ts) override;
	virtual void OnImgGuiRender() override;
	virtual void OnEvent(Hazel::Event& event) override;
private:
	Hazel::OrthographicCameraController m_CameraController;
	Hazel::Ref<Hazel::Shader> m_FlatShader;			// shader类 指针
	Hazel::Ref<Hazel::VertexArray> m_FlatVertexArray;

	glm::vec4 m_FlatColor = { 0.2f, 0.3f, 0.8f, 1.0f };
};
```

```c++
#include "Sandbox2D.h"
#include "imgui/imgui.h"
#include <Platform/OpenGL/OpenGLShader.h>
#include <glm/gtc/matrix_transform.hpp>
#include <glm/gtc/type_ptr.hpp>
Sandbox2D::Sandbox2D() : Layer("Sandbox2D"), m_CameraController(1280.0f / 720.0f, true){}
void Sandbox2D::OnAttach(){
	// 渲染网格 flat
	float flatVertices[3 * 4] = {
		-0.75f, -0.75f, 0.0f,
		0.75f, -0.75f, 0.0f,
		0.75f,  0.75f, 0.0f,
		-0.75f,  0.75f, 0.0f
	};
	// 1.创建顶点数组
	m_FlatVertexArray = (Hazel::VertexArray::Create());
	// 2.创建顶点缓冲区
	Hazel::Ref<Hazel::VertexBuffer> flatVB;
	flatVB.reset(Hazel::VertexBuffer::Create(flatVertices, sizeof(flatVertices)));
	// 2.1设置顶点缓冲区布局
	flatVB->SetLayout({
		{Hazel::ShaderDataType::Float3, "a_Position"}
		});
	// 1.1顶点数组添加顶点缓冲区，并且在这个缓冲区中设置布局
	m_FlatVertexArray->AddVertexBuffer(flatVB);
	// 3.索引缓冲
	uint32_t flatIndices[] = { 0, 1, 2, 2, 3, 0 };
	Hazel::Ref<Hazel::IndexBuffer> flatIB;
	flatIB.reset(Hazel::IndexBuffer::Create(flatIndices, sizeof(flatIndices) / sizeof(uint32_t)));
	// 1.2顶点数组设置索引缓冲区
	m_FlatVertexArray->SetIndexBuffer(flatIB);
	m_FlatShader = (Hazel::Shader::Create("assets/shaders/FlatColor.glsl"));
}
void Sandbox2D::OnDetach(){}
Sandbox2D::~Sandbox2D(){}
void Sandbox2D::OnUpdate(Hazel::Timestep ts){
	m_CameraController.OnUpdate(ts);

	Hazel::RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
	Hazel::RenderCommand::Clear();

	Hazel::Renderer::BeginScene(m_CameraController.GetCamera());

	std::dynamic_pointer_cast<Hazel::OpenGLShader>(m_FlatShader)->Bind();
	std::dynamic_pointer_cast<Hazel::OpenGLShader>(m_FlatShader)->UploadUniformFloat4("u_Color", m_FlatColor);
	glm::mat4 squareTexCoordtransfrom = glm::translate(glm::mat4(1.0f), { 0.0f, 0.0f, 0.0f });
	Hazel::Renderer::Submit(m_FlatShader, m_FlatVertexArray, squareTexCoordtransfrom);

	Hazel::Renderer::EndScene();
}
void Sandbox2D::OnImgGuiRender(){
	ImGui::Begin("Settings");
	ImGui::ColorEdit4("Square Color", glm::value_ptr(m_FlatColor));
	ImGui::End();
}
void Sandbox2D::OnEvent(Hazel::Event& event){
	// 事件
	m_CameraController.OnEvent(event);
}
```





