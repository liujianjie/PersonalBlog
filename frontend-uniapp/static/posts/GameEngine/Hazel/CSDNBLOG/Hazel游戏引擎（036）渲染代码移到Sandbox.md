> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  将Hazel项目下的Application类中的渲染相关代码都**移动**到Sandbox项目下的SandboxApp类下。

  Hazel定位是引擎内部实现，Sandbox定位是测试调用Hazel引擎功能

# 补充35.正交摄像机的旋转

- 摄像机的移动

  相机移动的时候，物体做相反的移动，这一点在transform矩阵取**逆**得到观察矩阵解决。

- 摄像机的旋转

  不同摄像机移动，摄像机的旋转**不会**与物体相反。

  而是**摄像机左旋，物体也左旋**。

- 而我们要实现

  将摄像机旋转与摄像机的移动统一，即：**摄像机左旋，物体右旋**。

- 前置要点

  摄像机度数为**正**->**右**旋，度数为**负**->**左**旋

- 从而编写代码时

  - 若按下A键

    - 原本按照常理

      A代表左边，应该是摄像机左旋，物体也左旋的

      ```cpp
      m_CameraRotation -= m_CameraRotationSpeed;
      ```

    - 但要实现与摄像机的移动统一

      需要造成**看起来**摄像机左旋，物体右旋的效果。

      所以需要

      ```cpp
      m_CameraRotation += m_CameraRotationSpeed;
      ```

      能实现摄像机<font color="red">**左**</font>旋，物体<font color ="green">**右**</font>旋的效果

      但实际上是摄像机与物体都变为右旋，摄像机左旋与物体右旋是**错觉**。

  - 若按下D键

    - 原本按照常理

      D代表右边，应该是摄像机右旋，物体也右旋的

      ```cpp
      m_CameraRotation += m_CameraRotationSpeed;
      ```

    - 但要实现与摄像机的移动统一

      需要造成**看起来**摄像机右旋，物体左旋的效果。

      所以需要

      ```cpp
      m_CameraRotation -= m_CameraRotationSpeed;
      ```

       能实现摄像机<font color ="green">**右**</font>旋，物体<font color ="red">**左**</font>旋的效果

      但实际上是摄像机与物体都变为左旋，摄像机右旋与物体左旋是**错觉**。

# 项目相关

## 用事件来移动旋转摄像机

```c++
void OnEvent(Hazel::Event& event) override {
    // 用事件完成移动摄像机
    Hazel::EventDispatcher dispatcher(event);
    // 事件调度器，拦截键盘按下事件
    dispatcher.Dispatch<Hazel::KeyPressedEvent>(HZ_BIND_EVENT_FN(ExampleLayer::OnKeyPressedEvent));
}
// 拦截键盘按下事件要执行的函数///////////////////////////////////////
bool OnKeyPressedEvent(Hazel::KeyPressedEvent& event) {
    if (event.GetKeyCode() == HZ_KEY_UP) {
        m_CameraPosition.y += m_CameraMoveSpeed;
    }
    else if (event.GetKeyCode() == HZ_KEY_DOWN) {
        m_CameraPosition.y -= m_CameraMoveSpeed;
    }
    if (event.GetKeyCode() == HZ_KEY_LEFT) {
        m_CameraPosition.x -= m_CameraMoveSpeed;
    }
    else if (event.GetKeyCode() == HZ_KEY_RIGHT) {
        m_CameraPosition.x += m_CameraMoveSpeed;
    }
    // 本节补充摄像机左旋、物体右旋的效果/////////////////////////////////////////////
    if (event.GetKeyCode() == HZ_KEY_A) {
        m_CameraRotation += m_CameraRotationSpeed;
    }
    // 本节补充摄像机右旋、物体左旋的效果/////////////////////////////////////////////
    else if (event.GetKeyCode() == HZ_KEY_D) {
        m_CameraRotation -= m_CameraRotationSpeed;
    }
    return false;
}
```

- 说明

  这个方法并不好，会卡顿，因为事件转发需要**时间**

  所以移动选择摄像机应该放在update每一帧更新上

## 代码+在Update来移动旋转摄像机

```cpp
#include <Hazel.h>
#include "imgui/imgui.h"
class ExampleLayer :public Hazel::Layer {
public:
	ExampleLayer() : Layer("Example"), m_Camera(-1.6f, 1.6f, -0.9f, 0.9f) ,m_CameraPosition(0.0f){
		// 渲染一个三角形所做的准备
		// 0.顶点数据
		float vertices[3 * 7] = {
			-0.5f, -0.5f, 0.0f, 0.8f, 0.2f, 0.8f, 1.0f,
			0.5f, -0.5f, 0.0f, 0.2f, 0.3f, 0.8f, 1.0f,
			0.0f,  0.5f, 0.0f, 0.8f, 0.8f, 0.2f, 1.0f
		};
		unsigned int indices[3] = { 0, 1, 2 }; // 索引数据
		// 1.生成顶点数组对象VAO
		m_VertexArray.reset(Hazel::VertexArray::Create());
		// 2.顶点缓冲
		std::shared_ptr<Hazel::VertexBuffer> vertexBuffer;
		vertexBuffer.reset(Hazel::VertexBuffer::Create(vertices, sizeof(vertices)));
		// 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
		Hazel::BufferLayout layout = {
			{ Hazel::ShaderDataType::Float3, "a_Position" },
			{ Hazel::ShaderDataType::Float4, "a_Color" }
		};
		// 3.先设置顶点缓冲布局-计算好各个属性的所需的值
		vertexBuffer->SetLayout(layout);
		// 4.再给顶点数组添加顶点缓冲-设置各个属性的顶点属性指针
		m_VertexArray->AddVertexBuffer(vertexBuffer);
		// 5.索引缓冲
		std::shared_ptr<Hazel::IndexBuffer> indexBuffer;
		indexBuffer.reset(Hazel::IndexBuffer::Create(indices, sizeof(indices) / sizeof(uint32_t)));
		// 6.给顶点数组设置索引缓冲
		m_VertexArray->SetIndexBuffer(indexBuffer);
		// 着色器代码
		std::string vertexSrc = R"(
			#version 330 core
			
			layout(location = 0) in vec3 a_Position;
			layout(location = 1) in vec4 a_Color;
			uniform mat4 u_ViewProjection;
			out vec3 v_Position;
			out vec4 v_Color;
			void main()
			{
				v_Position = a_Position;
				v_Color = a_Color;
				gl_Position = u_ViewProjection * vec4(a_Position, 1.0);	
			}
		)";
		std::string fragmentSrc = R"(
			#version 330 core
			
			layout(location = 0) out vec4 color;
			in vec3 v_Position;
			in vec4 v_Color;
			void main()
			{
				color = vec4(v_Position * 0.5 + 0.5, 1.0);
				color = v_Color;
			}
		)";
		m_Shader.reset(new Hazel::Shader(vertexSrc, fragmentSrc));

		// 渲染一个quad所做的准备
		// 0.顶点数据
		float squareVertices[3 * 4] = {
			-0.75f, -0.75f, 0.0f,
			 0.75f, -0.75f, 0.0f,
			 0.75f,  0.75f, 0.0f,
			-0.75f,  0.75f, 0.0f
		};
		uint32_t squareIndices[6] = { 0, 1, 2, 2, 3, 0 }; // 索引数据
		// 1.生成顶点数组对象VAO
		m_SquareVA.reset(Hazel::VertexArray::Create());
		// 2.顶点缓冲
		std::shared_ptr<Hazel::VertexBuffer> squareVB;
		squareVB.reset(Hazel::VertexBuffer::Create(squareVertices, sizeof(squareVertices)));
		// 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
		Hazel::BufferLayout layout2 = {
			{ Hazel::ShaderDataType::Float3, "a_Position" }
		};
		// 3.先设置顶点缓冲布局-计算好各个属性的所需的值
		squareVB->SetLayout(layout2);
		// 4.再给顶点数组添加顶点缓冲-设置各个属性的顶点属性指针
		m_SquareVA->AddVertexBuffer(squareVB);
		// 5.索引缓冲
		std::shared_ptr<Hazel::IndexBuffer> squareIB;
		squareIB.reset(Hazel::IndexBuffer::Create(squareIndices, sizeof(squareIndices) / sizeof(uint32_t)));
		// 6.给顶点数组设置索引缓冲
		m_SquareVA->SetIndexBuffer(squareIB);
		// 着色器代码
		std::string blueShaderVertexSrc = R"(
			#version 330 core
			layout(location = 0) in vec3 a_Position;
			uniform mat4 u_ViewProjection;
			out vec3 v_Position;
			void main()
			{
				v_Position = a_Position;
				gl_Position = u_ViewProjection * vec4(a_Position, 1.0);	
			}
		)";
		std::string blueShaderFragmentSrc = R"(
			#version 330 core
			layout(location = 0) out vec4 color;
			in vec3 v_Position;
			void main()
			{
				color = vec4(0.2, 0.3, 0.8, 1.0);
			}
		)";
		m_BlueShader.reset(new Hazel::Shader(blueShaderVertexSrc, blueShaderfragmentSrc));
	}
    //////////////////////////////////////////////////////////////////////////////
	void OnUpdate() override {// 轮询/////////////////////////////////////////////
		if (Hazel::Input::IsKeyPressed(HZ_KEY_UP)) {
			m_CameraPosition.y += m_CameraMoveSpeed;
		}
		else if (Hazel::Input::IsKeyPressed(HZ_KEY_DOWN)) {
			m_CameraPosition.y -= m_CameraMoveSpeed;
		}
		if (Hazel::Input::IsKeyPressed(HZ_KEY_LEFT)) {
			m_CameraPosition.x -= m_CameraMoveSpeed;
		}
		else if (Hazel::Input::IsKeyPressed(HZ_KEY_RIGHT)) {
			m_CameraPosition.x += m_CameraMoveSpeed;
		}
        // 本节补充摄像机左旋、物体右旋的效果/////////////////////////////////////////////
		if (Hazel::Input::IsKeyPressed(HZ_KEY_A)) {
			m_CameraRotation += m_CameraRotationSpeed; // 注意是+
		}
        // 本节补充摄像机右旋、物体左旋的效果/////////////////////////////////////////////
		else if (Hazel::Input::IsKeyPressed(HZ_KEY_D)) {
			m_CameraRotation -= m_CameraRotationSpeed;
		}
		Hazel::RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
		Hazel::RenderCommand::Clear();

		m_Camera.SetPosition(m_CameraPosition);
		m_Camera.SetRotation(m_CameraRotation);
		Hazel::Renderer::BeginScene(m_Camera);

		// 正方形
		Hazel::Renderer::Submit(m_BlueShader, m_SquareVA);

		// 三角形
		Hazel::Renderer::Submit(m_Shader, m_VertexArray);
		Hazel::Renderer::EndScene();
	}
	.......
private:
	std::shared_ptr<Hazel::Shader> m_Shader;				// shader类 指针
	std::shared_ptr<Hazel::VertexArray> m_VertexArray;		// 顶点数组类 指针
	std::shared_ptr<Hazel::Shader> m_BlueShader;			// shader类 指针
	std::shared_ptr<Hazel::VertexArray> m_SquareVA;			// 顶点数组类 指针
	Hazel::OrthographicCamera m_Camera;
	// 为完成移动旋转的属性
	glm::vec3 m_CameraPosition;
	float m_CameraMoveSpeed = 0.05f;
	float m_CameraRotation = 0.0f;
	float m_CameraRotationSpeed = 1.0f;
};
class Sandbox : public Hazel::Application {
public:
	Sandbox() {
		PushLayer(new ExampleLayer());
	}
	~Sandbox() {}
};
Hazel::Application* Hazel::CreateApplication() {
	return new Sandbox();
}
```

- 说明

  可见在Update上根据按下按键而移动选择摄像机。

  但是每个人的电脑的显示器一秒刷新率不同，60HZ的一秒刷新60帧，移动**60**米，而144HZ的一秒刷新144帧，移动**144**米，不公平（下节具体讲解）。

## 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022044658.png)