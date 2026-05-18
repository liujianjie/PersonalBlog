> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 054节

  - 054节已做

    创建一个带有纹理采样的shader，使在图形表面上可以显示纹理

  - 问题所在

    1. 一个shader**不采样**纹理，一个shader**采样**纹理
    2. 这样需要**每次换bind shader**，这样会造成性能损失
    3. 所以调整shader代码和程序代码，使得能**用一个**shader从而实现既能渲染纯颜色的图形，也能实现带纯纹理的图形。

- 如何用一个shader解决此问题

  - 解决方法：修改片段着色器代码

    片段的颜色 = 纹理采样后的颜色 * 颜色。

  - 浅原理

    1. shader采样纹理后得到的一个颜色值
    2. 这个颜色值是纹理的颜色值
    3. 并且可以与任何vec3颜色相乘，可以得出纹理与颜色**混合**的效果

  - 对于需要**纯颜色**的图形

    用opengl创建一个**全白的纹理**进行采样，这样的话：

    片段的颜色 = 1 * 颜色

  - 对于需要**纯纹理**的图形

    程序上传纯白颜色给Opengl就行

    片段的颜色 = 纹理采样后的颜色 * 1

# 关键代码

## CPP：创建白色的纹理

```c++
OpenGLTexture2D::OpenGLTexture2D(uint32_t width, uint32_t height)
    :m_Width(width), m_Height(height)
    {
        m_InternalFormat = GL_RGBA8;
        m_DataFormat = GL_RGBA;
        /*是纹理、要1个、生成纹理缓冲区返回id给变量*/ // 是GL_TEXTURE_2D，写错过GL_TEXTURE
        glCreateTextures(GL_TEXTURE_2D, 1, &m_RendererID);
        /*告诉OpenGLm_RendererID的纹理存储的是rbg8位，宽高的缓冲区*/
        glTextureStorage2D(m_RendererID, 1, m_InternalFormat, m_Width, m_Height);
        /*告诉opengl，纹理缩小时用线性过滤*/
        glTextureParameteri(m_RendererID, GL_TEXTURE_MIN_FILTER, GL_LINE);
        /*告诉opengl，纹理放大时用周围颜色的平均值过滤*/
        glTextureParameteri(m_RendererID, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
        // 纹理坐标超过1采取的措施
        glTextureParameteri(m_RendererID, GL_TEXTURE_WRAP_S, GL_REPEAT);
        glTextureParameteri(m_RendererID, GL_TEXTURE_WRAP_T, GL_REPEAT);
    }
// data是白色值
void OpenGLTexture2D::SetData(void* data, uint32_t size)
{
    uint32_t bpp = m_DataFormat == GL_RGBA ? 4 : 3;
    HZ_CORE_ASSERT(size == m_Width * m_Height * bpp, "数据大小与纹理大小不符");
    glTextureSubImage2D(m_RendererID, 0, 0, 0, m_Width , m_Height, m_DataFormat, GL_UNSIGNED_BYTE, data);
}
......
Renderer2D.cpp
    static struct Renderer2DStorage{
        Ref<VertexArray> QuadVertexArray;
        Ref<Shader> TextureShader;
        Ref<Texture2D> WhiteTexture;
    };    
// 创建一个白色Texture
s_Data->WhiteTexture = Hazel::Texture2D::Create(1, 1);
uint32_t whiteTextureData = 0xffffffff;
s_Data->WhiteTexture->SetData(&whiteTextureData, sizeof(uint32_t));
```

## GLSL代码：片段的最终颜色

```glsl
// 纹理的glsl
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

uniform vec4 u_Color;
in vec2 v_TexCoord;

uniform sampler2D u_Texture; 

void main() {
	color = texture(u_Texture, v_TexCoord * 10.0f) * u_Color;	//片段的颜色 = 纹理采样后的颜色 * 颜色。
}
```

# 项目代码

- core.h：自定义别名

  ```cpp
  namespace Hazel {
  	template<typename T>
  	using Scope = std::unique_ptr<T>;
  
  	template<typename T, typename ...Args>
  	constexpr Scope<T> CreateScope(Args&& ...args) {
  		return std::make_unique<T>(std::forward<Args>(args)...);
  	}
  
  	template<typename T>
  	using Ref = std::shared_ptr<T>;
  
  	template<typename T, typename ...Args>
  	constexpr Ref<T> CreateRef(Args&& ...args) {
  		return std::make_shared<T>(std::forward<Args>(args)...);
  	}
  }
  ```

- OpenGLTexture.cpp

  ```cpp
  OpenGLTexture2D::OpenGLTexture2D(uint32_t width, uint32_t height)
  :m_Width(width), m_Height(height)
  {
      m_InternalFormat = GL_RGBA8;
      m_DataFormat = GL_RGBA;
      /*是纹理、要1个、生成纹理缓冲区返回id给变量*/ // 是GL_TEXTURE_2D，写错过GL_TEXTURE
      glCreateTextures(GL_TEXTURE_2D, 1, &m_RendererID);
      /*告诉OpenGLm_RendererID的纹理存储的是rbg8位，宽高的缓冲区*/
      glTextureStorage2D(m_RendererID, 1, m_InternalFormat, m_Width, m_Height);
      /*告诉opengl，纹理缩小时用线性过滤*/
      glTextureParameteri(m_RendererID, GL_TEXTURE_MIN_FILTER, GL_LINE);
      /*告诉opengl，纹理放大时用周围颜色的平均值过滤*/
      glTextureParameteri(m_RendererID, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
      // 纹理坐标超过1采取的措施
      glTextureParameteri(m_RendererID, GL_TEXTURE_WRAP_S, GL_REPEAT);
      glTextureParameteri(m_RendererID, GL_TEXTURE_WRAP_T, GL_REPEAT);
  }
  /*
  data 指向的数据为纹理的具体数据，如白色:0xffffffff,与上对应，上面的data是指向路径下的纹理数据
  */
  void OpenGLTexture2D::SetData(void* data, uint32_t size)
  {
      uint32_t bpp = m_DataFormat == GL_RGBA ? 4 : 3;
      HZ_CORE_ASSERT(size == m_Width * m_Height * bpp, "数据大小与纹理大小不符");
      glTextureSubImage2D(m_RendererID, 0, 0, 0, m_Width , m_Height, m_DataFormat, GL_UNSIGNED_BYTE, data);
  }
  ```

- Renderer2D.cpp

  ```cpp
  static struct Renderer2DStorage{
      Ref<VertexArray> QuadVertexArray;
      Ref<Shader> TextureShader;
      Ref<Texture2D> WhiteTexture;// 白色纹理
  };
  
  // 创建一个白色Texture
  s_Data->WhiteTexture = Hazel::Texture2D::Create(1, 1);
  uint32_t whiteTextureData = 0xffffffff;
  s_Data->WhiteTexture->SetData(&whiteTextureData, sizeof(uint32_t));
  
  // 对于一个只想绘制带有纯颜色的图形
  void Hazel::Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const glm::vec4& color)
  {
      ////////////////////////////////////////////////////////////////
      // 将白色纹理绑定在纹理单元0号上////////////////////////////////////
      s_Data->WhiteTexture->Bind();
  
      // 设置transform
      glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
      glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
      s_Data->TextureShader->Bind();		// 绑定shader
      // 上传自定义颜色
      s_Data->TextureShader->SetFloat4("u_Color", color);
      s_Data->TextureShader->SetMat4("u_Transform", tranform);
  
      s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
      RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  }
  // 对于一个只想绘制带有纯纹理的图形
  
  void Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const Ref<Texture2D>& texture)
  {
      ////////////////////////////////////////////////////////////////
      // 绑定纹理//////////////////////////////////////////////////////
      texture->Bind();
  
      // 设置transform
      glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
          glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
      s_Data->TextureShader->Bind();		// 绑定shader
      ////////////////////////////////////////////////////////////////
      // 上传白色
      s_Data->TextureShader->SetFloat4("u_Color", glm::vec4(1.0f));
      s_Data->TextureShader->SetMat4("u_Transform", tranform);
  
      s_Data->QuadVertexArray->Bind();		// 绑定顶点数组
      RenderCommand::DrawIndexed(s_Data->QuadVertexArray);
  }
  ```

# 正确结果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231820342.png)

# 测试：不创建一个白色的纹理

删除创建白色纹理代码（s_Data->WhiteTexture相关代码）后，的问题有如下

- 颜色与棋盘混在一起

  因为OpenGL是个状态机，纹理会**重复使用**

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231820832.png)

- 尝试解决棋盘纹理重复使用后的新问题

  - 为什么会重复使用

    棋盘纹理的纹理缓冲区ID1绑定在0号纹理单元，却没解绑，所以会一直重复利用

  - 0号纹理单元如何解绑纹理缓冲区ID1

    只需要：重新绑定0号纹理单元对应的纹理缓冲区。

  - 在绘画完后**解绑**

    ```cpp
    void OpenGLRendererAPI::DrawIndexed(const Ref<VertexArray>& vertexArray)
    {
        glDrawElements(GL_TRIANGLES, vertexArray->GetIndexBuffer()->GetCount(), GL_UNSIGNED_INT, nullptr);
        // 没有设置开启哪个纹理单元，默认是0号纹理单元，所以0号单元与0号纹理缓冲区互绑
        glBindTexture(GL_TEXTURE_2D, 0);
    }
    ```

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231820728.png)

    1. 由于纹理缓冲区0并没有任何数据，数据默认为黑色，采样后的颜色值为0

    2. 片段颜色 = 0 * u_color; 
    3. 所以最后为0黑色



