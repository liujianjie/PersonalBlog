> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  扩展Renderer2D渲染类，重载DrawQuad函数，使其能够在图形表面上**显示纹理**

# 注意小点与测试

## 注意小点

- 程序上传数据给GLSL需要**先绑定**使用的是哪个Shader

- GLSL纹理采样的颜色可以**和颜色相乘**

  ```
  color = texture(u_Texture, v_TexCoord * 10.0f) * vec4(1.0, 0.0, 0.0, 1.0);	// 新
  ```

## 测试1：调整图形的z值

OpenGL是右手坐标系，z为负才是后移图形（将图形远离摄像机），而且要记得**先开启深度测试**

```cpp
// 开启深度测试
glEnable(GL_DEPTH_TEST);
```

- z大于0时：带有棋盘纹理的Quad显示在最**上**层

  ```cpp
  Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, 0.1f }, { 1.0f, 1.0f }, m_SquareTexture);
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231820080.png)

- z小于0时：带有棋盘纹理的Quad显示在最**下**层

  ```cpp
  Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, -0.1f }, { 1.0f, 1.0f }, m_SquareTexture);
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231819271.png)

## 测试2：调整Scale放大

将Scale变大，图形变大

- 图形变大，纹理也只是**放大**，不会让纹理采取**已经设置**的平铺、重复**之一**

  ```cpp
  Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, -0.1f }, { 10.0f, 10.0f }, m_SquareTexture);
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231820833.png)

- 若想纹理采取**已经设置**的平铺、重复、边缘采样**之一**，需要在glsl里，将纹理**采样坐标**扩大

  ```cpp
  color = texture(u_Texture, v_TexCoord * 10.0f);	
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231819276.png)

- 解释：为什么需要将采用坐标扩大，才会采取**已经设置**的平铺、重复、边缘采样**之一**

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231820472.png)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231820906.png)

  10\*10的纹理坐标超过**默认的1\*1**的纹理坐标，所以会采取**设置的重复采样**

## 测试3：纹理坐标超过1*1

- 设置取**邻近边缘像素**：GL_CLAMP_TO_EDGE

  OpenGLTexture.cpp

  ```cpp
  glTextureParameteri(m_RendererID, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTextureParameteri(m_RendererID, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231820066.png)

- 设置**重复**采样纹理（这是默认的）：GL_REPEAT

  ```cpp
  glTextureParameteri(m_RendererID, GL_TEXTURE_WRAP_S, GL_REPEAT);
  glTextureParameteri(m_RendererID, GL_TEXTURE_WRAP_T, GL_REPEAT);
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231819276.png)

# 代码

- Sandbox2D

  ```cpp
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
  	Hazel::Ref<Hazel::Texture2D> m_SquareTexture;		// 纹理类
  
  	glm::vec4 m_FlatColor = { 0.2f, 0.3f, 0.8f, 1.0f };
  };
  ```

  ```cpp
  #include "Sandbox2D.h"
  #include "imgui/imgui.h"
  #include <glm/gtc/matrix_transform.hpp>
  #include <glm/gtc/type_ptr.hpp>
  #include <Hazel/Renderer/Renderer2D.h>
  Sandbox2D::Sandbox2D() : Layer("Sandbox2D"), m_CameraController(1280.0f / 720.0f, true){}
  void Sandbox2D::OnAttach(){
  	//Hazel::Renderer2D::Init();
  	m_SquareTexture = Hazel::Texture2D::Create("assets/textures/Checkerboard.png");
  }
  void Sandbox2D::OnDetach(){}
  Sandbox2D::~Sandbox2D(){}
  void Sandbox2D::OnUpdate(Hazel::Timestep ts){
  	m_CameraController.OnUpdate(ts);
  
  	Hazel::RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
  	Hazel::RenderCommand::Clear();
  
  	Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
  	Hazel::Renderer2D::DrawQuad({-1.0f, 0.0f}, {0.8f,0.8f}, m_FlatColor);
  	Hazel::Renderer2D::DrawQuad({ 0.5f, -0.5f }, { 0.5f, 0.8f }, {0.2f, 0.8f, 0.9f, 1.0f});
      //////////////////////////////////////////////////////////////////////////
      //////////////////////////////////////////////////////////////////////////
      // 调用2D渲染类新增的绘制带有纹理的Quad函数/////////////////////////////////////
  	Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, -0.1f }, { 10.0f, 10.0f }, m_SquareTexture);
  	Hazel::Renderer2D::EndScene();
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

- OpenGLRendererAPI.cpp

  ```cpp
  void OpenGLRendererAPI::Init(){
      // 开启混合
      glEnable(GL_BLEND);
      // 混合函数
      glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
      // 开启深度测试
      glEnable(GL_DEPTH_TEST);
  }
  ```

- Renderer2D.cpp

  ```cpp
  Init(){
      // 加上纹理坐标
      float flatVertices[] = {
  			-0.75f, -0.75f, 0.0f, 0.0f, 0.0f,
  			0.75f, -0.75f, 0.0f,  1.0f,	0.0f,
  			0.75f,  0.75f, 0.0f,  1.0f,1.0f,
  			-0.75f,  0.75f, 0.0f, 0.0f, 1.0f
  		};
      // 1.2顶点数组设置索引缓冲区
      s_Data->QuadVertexArray->SetIndexBuffer(flatIB);
  
      s_Data->FlatColorShader = (Hazel::Shader::Create("assets/shaders/FlatColor.glsl"));
  	//////////////////////////////////////////////////////////////
  	//////////////////////////////////////////////////////////////
      // 带有纹理的shader////////////////////////////////////////////
      s_Data->TextureShader = (Hazel::Shader::Create("assets/shaders/Texture.glsl"));
      /*
          设置fragment片段着色器的u_Texture代表0号纹理单元
      */
      s_Data->TextureShader->SetInt("u_Texture", 0);
  }
  void Hazel::Renderer2D::BeginScene(const OrthographicCamera& camera)
  {
  
      s_Data->FlatColorShader->Bind();		// 绑定shader
      // 上传矩阵数据给shader前，需要先绑定使用哪个shader！
      s_Data->FlatColorShader->SetMat4("u_ViewProjection", camera.GetViewProjectionMatrix());
  
  
      s_Data->TextureShader->Bind();		// 绑定shader
      s_Data->TextureShader->SetMat4("u_ViewProjection", camera.GetViewProjectionMatrix());
  }
  
  void Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const Ref<Texture2D>& texture)
  {
      ////////////////////////////////////////////////
      ////////////////////////////////////////////////
      // 绑定纹理//////////////////////////////////////
      /* 
      1.这个纹理的m_RendererID（纹理缓冲区的ID）是1
      2.texture->Bind();后，这个函数将m_RendererID=1的纹理缓冲区绑定到0号纹理单元上
       (1)texture的实参是m_SquareTexture
       (2)m_SquareTexture加载了Checkerboard.png图片
       (3)所以m_RendererID=1的纹理缓冲区是Checkerboard.png的图片数据
      3.而之前代码s_Data->TextureShader->SetInt("u_Texture", 0);设置了片段着色器的u_Texture代表0号纹理单元
      4.所以片段采样器采样0号纹理单元的数据的时候，就是采样Checkerboard.png图片数据，所以Checkerboard.png图片会覆在Quad	  表面上
  	*/
      texture->Bind();
      // 设置transform
      glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
      glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
      s_Data->TextureShader->Bind();		// 绑定shader
      s_Data->TextureShader->SetMat4("u_Transform", tranform);
  
      s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
      RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  }
  ```

- OpenGLTexture

  ```cpp
  #pragma once
  #include "Hazel/Renderer/Texture.h"
  namespace Hazel {
  	class OpenGLTexture2D : public Texture2D{
  	public:
  		OpenGLTexture2D(const std::string& path);
  		virtual ~OpenGLTexture2D();
  		virtual uint32_t GetWidth() const override { return m_Width; };
  		virtual uint32_t GetHeight() const override { return m_Height; };
          // slot = 0，即默认设置当前纹理缓冲区到0号纹理单元上
  		virtual void Bind(uint32_t slot = 0) const override;
  	private:
  		std::string m_Path;
  		uint32_t m_Width, m_Height;
  		uint32_t m_RendererID;
  	};
  }
  ```

  ```cpp
  void OpenGLTexture2D::Bind(uint32_t slot) const
  {
      // 0号纹理单元默认开启，不需要写glActiveTexture(GL_TEXTURE0); 代码
      glBindTextureUnit(slot, m_RendererID);
  }
  ```

- Texture.glsl

  ```cpp
  #type vertex
  #version 330 core
  
  layout(location = 0) in vec3 a_Position;
  layout(location = 1) in vec2 a_TexCoord;
  
  uniform mat4 u_ViewProjection;
  uniform mat4 u_Transform;
  
  out vec3 v_Position;
  out vec2 v_TexCoord;
  
  void main() {
  	v_TexCoord = a_TexCoord;
  	gl_Position = u_ViewProjection * u_Transform * vec4(a_Position, 1.0);
  }
  
  #type fragment
  #version 330 core
  
  layout(location = 0) out vec4 color;
  
  in vec2 v_TexCoord;
  // 这里////////////////////////////////////
  uniform sampler2D u_Texture; // u_Texture代表2D纹理单元
  
  void main() {
  	color = texture(u_Texture, v_TexCoord * 10.0f);	// 采样u_Texture代表的纹理单元
  	//color = vec4(v_TexCoord, 0.0f, 1.0f);	
  }
  ```

- 自己捋的顺序（也许不对）

  - OpenGLTexture类的m_RendererID

    代表**纹理缓冲区的ID**（m_RendererID=1）

  - glBindTextureUnit(0, m_RendererID);

    将纹理缓冲区的ID（m_RendererID=1）绑定到**0号纹理单元**上

  - s_Data->TextureShader->SetInt("u_Texture", 0);

    将片段着色器的u_Texture设置代表为0号纹理单元，u_Texture= 0 

  - texture(u_Texture, v_TexCoord * 10.0f);

    即采样u_Texture代表的0号纹理单元，而纹理单元上绑定的**纹理缓冲区是1**



