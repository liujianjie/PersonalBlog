> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 回顾纹理采样个人理解。

  1. 加载纹理资源，设置这个纹理资源开辟的缓冲区m_RendererID绑定在纹理槽0号上
  2. glsl上采样的纹理，在纹理槽0号上采样，纹理槽0号指向了第1步的纹理资源，这样就完成对这个加载的纹理采样。

- OpenGL的纹理槽

  OpenGL限制了一次drawcall能使用多少个纹理槽，通常是**32**个

  但若想超过32有40个纹理需要使用，可以：

  - 分两次，第一次drawcall32个，然后清空重新加载纹理再drawcall
  - 通过绕开GPU32个纹理的限制，这个比较难。
  - 用纹理集，texture altas

  此节是一次drawcall使用**固定32**个纹理槽。

# 大致流程

1. 先提前为此次的shader上传一个默认的大小为32的采样**数组**

   u_Textures[i] = j，其中i = j，u_Textures[1] = 1表示片段着色器采样纹理槽**1**号上的纹理

   而纹理槽1号上的纹理缓冲区ID是不是等于1可以不用关心。

2. 加载一个纹理得到纹理对象，用数组保存这个纹理对象

3. 在绘制**带有纹理**的quad图形时，判断数组中是否有这个纹理对象

   有就取出 **i** 下标

   没有就加在数组已有纹理的末尾，并且记录下标 **i** 

4. 设置当前顶点采样的纹理单元是 **i**，后续会将这个纹理槽号 **i** 从顶点阶段传入到fragment片段着色器阶段

5. 在Drawcall前，TextureSlots数组上存储已经加载的纹理，按照顺序依次**绑定到对应的纹理槽**上

6. Drawcall时，在片段着色器上，读取采样对应纹理槽号**i**上的纹理

# 代码流程

- 先记住数据结构

  - std::array<Ref<Texture2D>, MaxTextureSlots> TextureSlots;

    是一个32大小的数组，数组的元素是纹理对象指针，用来存储加载好了的纹理对象的

  - int32_t samplers[s_Data.MaxTextureSlots];

    是一个32大小的数组，数组的元素是int值，用来上传给glsl的

1. 先提前为此次的shader上传一个默认的大小为32的采样数组，u_Textures[i] = j, 其中i = j,u_Textures[1] = 1表示采样纹理槽1号上的纹理

   ```c++
   // 纹理的shader
   s_Data.TextureShader = Shader::Create("assets/shaders/Texture.glsl");
   
   int32_t samplers[s_Data.MaxTextureSlots];
   for (uint32_t i = 0; i < s_Data.MaxTextureSlots; i++) {
   samplers[i] = i;
   }
   s_Data.TextureShader->Bind();// 上传数据前要先绑定shader
   // 为TextureShader上传一个默认的大小为32的采样数组，u_Textures[i] = j，其中i = j,u_Textures[1] = 1表示采样纹理槽1号上的纹理
   s_Data.TextureShader->SetIntArray("u_Textures", samplers, s_Data.MaxTextureSlots);
   ```

2. 加载一个纹理得到纹理对象，用数组保存这个纹理对象

   ```c++
   // 白色纹理
   // 创建一个白色Texture
   s_Data.WhiteTexture = Texture2D::Create(1, 1);
   uint32_t whiteTextureData = 0xffffffff;
   s_Data.WhiteTexture->SetData(&whiteTextureData, sizeof(uint32_t));
   
   // 0号纹理槽对应白色纹理缓冲区
   s_Data.TextureSlots[0] = s_Data.WhiteTexture;
   ```

3. 在当前绘制quad图形时，判断TextureSlots数组是否有这个纹理，有就取出 i 下标，没有就加在数组已有纹理的末尾，并且记录下标 **i** 

   ```c++
   float textureIndex = 0.0f;
   for (uint32_t i = 1; i < s_Data.TextureSlotIndex; i++)
   {
       // 当前纹理，如果已经存储在纹理槽，就直接读取
       if (*s_Data.TextureSlots[i].get() == *texture.get()) {
           textureIndex = (float)i;
           break;
       }
   }
   if (textureIndex == 0.0f) {
       textureIndex = (float)s_Data.TextureSlotIndex;// 代表在数组中没有纹理对象的位置
       s_Data.TextureSlots[s_Data.TextureSlotIndex] = texture;
       s_Data.TextureSlotIndex++;// 记得++
   }
   // 设置当前顶点采样的纹理单元是 **i**
   ```

4. 在顶点数据数组设置当前顶点采样的纹理单元是 **i**，后续在第6步会将这个纹理槽号 **i** 传入到fragment阶段

   ```c++
   // quad的左下角为起点
   s_Data.QuadVertexBufferPtr->Position = position;
   s_Data.QuadVertexBufferPtr->Color = color;
   s_Data.QuadVertexBufferPtr->TexCoord = { 0.0f, 0.0f };
   s_Data.QuadVertexBufferPtr->TexIndex = textureIndex; // 采样的纹理槽号
   s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
   s_Data.QuadVertexBufferPtr++;
   ```

   glsl相关

   ```c++
   s_Data.QuadVertexBuffer->SetLayout({
   {Hazel::ShaderDataType::Float3, "a_Position"},
   {Hazel::ShaderDataType::Float4, "a_Color"},
   {Hazel::ShaderDataType::Float2, "a_TexCoord"},
   {Hazel::ShaderDataType::Float, "a_TexIndex"},
   {Hazel::ShaderDataType::Float, "a_TilingFactor"}
   });// 顶点布局
   
   #type vertex
   #version 330 core
   
   layout(location = 0) in vec3 a_Position;
   layout(location = 1) in vec4 a_Color;
   layout(location = 2) in vec2 a_TexCoord;
   layout(location = 3) in float a_TexIndex;
   layout(location = 4) in float a_TilingFactor;
   ```

5. 在Drawcall前，TextureSlots数组上存储已经加载的纹理，按照顺序依次**绑定到对应的纹理槽**上

   这样就与第3、4步设置当前顶点采样的**纹理槽号i**是TextureSlots数组上的**i号纹理**

   ```c++
   void Renderer2D::Flush()
   {
       // 对应i的texture绑定到i号纹理槽
       for (uint32_t i = 0; i < s_Data.TextureSlotIndex; i++) {
           s_Data.TextureSlots[i]->Bind(i);
       }
       RenderCommand::DrawIndexed(s_Data.QuadVertexArray, s_Data.QuadIndexCount);
   }
   ```

6. Drawcall时，在片段着色器上，读取采样对应纹理槽号**i**上的纹理

   ```glsl
   #type fragment
   #version 330 core
   
   layout(location = 0) out vec4 color;
   
   in vec4 v_Color;
   in vec2 v_TexCoord;
   in float v_TexIndex;// 从顶点着色器传入，在cpp代码的drawquad函数中设置
   in float v_TilingFactor;
   // 纹理槽号数组u_Textures[i] = j, 其中i = j,u_Textures[1] = 1表示采样纹理槽1号上的纹理
   uniform sampler2D u_Textures[32]; 
   
   void main() {
       // 采样纹理槽v_TexIndex号上的纹理
   	color = texture(u_Textures[int(v_TexIndex)], v_TexCoord * v_TilingFactor) * v_Color;	
   	//color = v_Color;
   }
   ```

# 注意bug

- 上传Shader数据前要先绑定

  ```c++
  s_Data.TextureShader->Bind();// 上传数据前要先绑定shader
  s_Data.TextureShader->SetIntArray("u_Textures", samplers, s_Data.MaxTextureSlots);
  ```

- glsl里u_color与v_color不要用混

- 去除glsl上的无关变量

# 问题

为什么Texture重载==运算符

```cpp
Texture2D
virtual bool operator==(const Texture2D& other) const = 0;
OpenGLShader
virtual bool operator==(const Texture2D& other) const override
{
    return m_RendererID == ((OpenGLTexture2D&)other).m_RendererID;
}
```

```cpp
void Renderer2D::DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
{
    HZ_PROFILE_FUNCTION();

    constexpr glm::vec4 color = { 1.0f, 1.0f, 1.0f, 1.0f };

    float textureIndex = 0.0f;
    for (uint32_t i = 1; i < s_Data.TextureSlotIndex; i++)
    {
        // 当前纹理，如果已经存储在纹理槽，就直接读取
        // 使用了 == 运算符，对比m_RendereID是否相同
        // TextureSlots数组的元素是Texture2D父类指针，而texture也是Texture2D父类指针
        if (*s_Data.TextureSlots[i].get() == *texture.get()) {
            textureIndex = (float)i;
            break;
        }
    }
```

1. TextureSlots数组的元素是Texture2D父类指针

2. 而texture也是Texture2D父类指针

3. 但是m_RendererID是OpenGLTexture2D子类的**私有**变量，且父类Texture2D无m_RendererID属性

4. 所以无法写*s_Data.TextureSlots[i].get().m_RendererID == *texture.get().m_RendererID

   ![image-20230722221359486](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231822956.png)

所以只能通过重载==运算符，然后再转换为子类对象，再访问私有成员属性进行对比

![image-20230722223013946](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231822960.png)

# 结果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231822962.png)

# 完整代码

Texture.glsl

```glsl
// 纹理的glsl
#type vertex
#version 330 core

layout(location = 0) in vec3 a_Position;
layout(location = 1) in vec4 a_Color;
layout(location = 2) in vec2 a_TexCoord;
layout(location = 3) in float a_TexIndex;
layout(location = 4) in float a_TilingFactor;

uniform mat4 u_ViewProjection;

out vec4 v_Color;
out vec2 v_TexCoord;
out float v_TexIndex;
out float v_TilingFactor;

void main() {
	v_Color = a_Color;
	v_TexCoord = a_TexCoord;
	v_TexIndex = a_TexIndex;
	v_TilingFactor = a_TilingFactor;
	gl_Position = u_ViewProjection * vec4(a_Position, 1.0);
}

#type fragment
#version 330 core

layout(location = 0) out vec4 color;

in vec4 v_Color;
in vec2 v_TexCoord;
in float v_TexIndex;
in float v_TilingFactor;

uniform sampler2D u_Textures[32]; 

void main() {
	 color = texture(u_Textures[int(v_TexIndex)], v_TexCoord * v_TilingFactor) * v_Color;
	//color = v_Color;
}
```

Renderer2D.cpp

```c++
#include "hzpch.h"
#include "Renderer2D.h"
#include "VertexArray.h"
#include "Buffer.h"
#include "Shader.h"
#include "Texture.h"
#include "RenderCommand.h"
#include <glm/gtc/matrix_transform.hpp>

namespace Hazel {
	struct QuadVertex {
		glm::vec3 Position;
		glm::vec4 Color;
		glm::vec2 TexCoord;
		float TexIndex;
		float TilingFactor;
	};
	struct Renderer2DData {
		const uint32_t MaxQuads = 10000;
		const uint32_t MaxVertices = MaxQuads * 4;
		const uint32_t MaxIndices = MaxQuads * 6;
		static const uint32_t MaxTextureSlots = 32; // 最大的纹理槽数

		Ref<VertexArray> QuadVertexArray;
		Ref<VertexBuffer> QuadVertexBuffer;
		Ref<Shader> TextureShader;
		Ref<Texture2D> WhiteTexture;

		uint32_t QuadIndexCount = 0;
		QuadVertex* QuadVertexBufferBase = nullptr;
		QuadVertex* QuadVertexBufferPtr = nullptr;

		std::array<Ref<Texture2D>, MaxTextureSlots> TextureSlots;
		uint32_t TextureSlotIndex = 1;// 0 号给白色纹理

	};
	static Renderer2DData s_Data;
	void Hazel::Renderer2D::Init()
	{
		HZ_PROFILE_FUNCTION();

		// 0.在CPU开辟存储s_Data.MaxVertices个的QuadVertex的内存
		s_Data.QuadVertexBufferBase = new QuadVertex[s_Data.MaxVertices];

		// 1.创建顶点数组
		s_Data.QuadVertexArray = VertexArray::Create();

		// 2.创建顶点缓冲区,先在GPU开辟一块s_Data.MaxVertices * sizeof(QuadVertex)大小的内存
		// 与cpu对应大，是为了传输顶点数据
		s_Data.QuadVertexBuffer = VertexBuffer::Create(s_Data.MaxVertices * sizeof(QuadVertex));

		// 2.1设置顶点缓冲区布局
		s_Data.QuadVertexBuffer->SetLayout({
			{Hazel::ShaderDataType::Float3, "a_Position"},
			{Hazel::ShaderDataType::Float4, "a_Color"},
			{Hazel::ShaderDataType::Float2, "a_TexCoord"},
			{Hazel::ShaderDataType::Float, "a_TexIndex"},
			{Hazel::ShaderDataType::Float, "a_TilingFactor"}
			});

		// 1.1顶点数组添加顶点缓冲区，并且在这个缓冲区中设置布局
		s_Data.QuadVertexArray->AddVertexBuffer(s_Data.QuadVertexBuffer);

		// 3.索引缓冲
		//uint32_t flatIndices[] = { 0, 1, 2, 2, 3, 0 };
		uint32_t* quadIndices = new uint32_t[s_Data.MaxIndices];

		// 一个quad用6个索引，012 230，456 674
		uint32_t offset = 0;
		for (uint32_t i = 0; i < s_Data.MaxIndices; i += 6) {
			quadIndices[i + 0] = offset + 0;
			quadIndices[i + 1] = offset + 1;
			quadIndices[i + 2] = offset + 2;

			quadIndices[i + 3] = offset + 2;
			quadIndices[i + 4] = offset + 3;
			quadIndices[i + 5] = offset + 0;

			offset += 4;
		}

		Ref<IndexBuffer> flatIB = IndexBuffer::Create(quadIndices, s_Data.MaxIndices);

		// 1.2顶点数组设置索引缓冲区
		s_Data.QuadVertexArray->SetIndexBuffer(flatIB);
		// cpu上传到gpu上了可以删除cpu的索引数据块了
		delete[] quadIndices;

		// 创建一个白色Texture
		s_Data.WhiteTexture = Texture2D::Create(1, 1);
		uint32_t whiteTextureData = 0xffffffff;
		s_Data.WhiteTexture->SetData(&whiteTextureData, sizeof(uint32_t));

		// 0号给白色纹理
		s_Data.TextureSlots[0] = s_Data.WhiteTexture;

		// 纹理的shader
		s_Data.TextureShader = Shader::Create("assets/shaders/Texture.glsl");

		int32_t samplers[s_Data.MaxTextureSlots];
		for (uint32_t i = 0; i < s_Data.MaxTextureSlots; i++) {
			samplers[i] = i;
		}
		s_Data.TextureShader->Bind();// 上传数据前要先绑定shader
		// 为TextureShader上传一个默认的大小为32的采样数组，u_Textures[i] = j，其中i = j,u_Textures[1] = 1表示采样纹理槽1号上的纹理
		s_Data.TextureShader->SetIntArray("u_Textures", samplers, s_Data.MaxTextureSlots);
	}

	void Hazel::Renderer2D::Shutdown()
	{
		HZ_PROFILE_FUNCTION();

		// 初始化
		s_Data.QuadIndexCount = 0;
		s_Data.QuadVertexBufferPtr = s_Data.QuadVertexBufferBase;

		s_Data.TextureSlotIndex = 1;
	}

	void Hazel::Renderer2D::BeginScene(const OrthographicCamera& camera)
	{
		HZ_PROFILE_FUNCTION();

		s_Data.TextureShader->Bind();		// 绑定shader
		s_Data.TextureShader->SetMat4("u_ViewProjection", camera.GetViewProjectionMatrix());

		// 相当于初始化此帧要绘制的索引数量，上传的顶点数据
		s_Data.QuadIndexCount = 0;
		// 指针赋予
		s_Data.QuadVertexBufferPtr = s_Data.QuadVertexBufferBase;
	}

	void Hazel::Renderer2D::EndScene()
	{
		HZ_PROFILE_FUNCTION();

		// 计算当前绘制需要多少个顶点数据
		uint32_t dataSize = (uint8_t*)s_Data.QuadVertexBufferPtr - (uint8_t*)s_Data.QuadVertexBufferBase;
		// 截取部分CPU的顶点数据上传OpenGL
		s_Data.QuadVertexBuffer->SetData(s_Data.QuadVertexBufferBase, dataSize);

		Flush();
	}

	void Renderer2D::Flush()
	{
		// 对应i的texture绑定到i号纹理槽
		for (uint32_t i = 0; i < s_Data.TextureSlotIndex; i++) {
			s_Data.TextureSlots[i]->Bind(i);
		}
		RenderCommand::DrawIndexed(s_Data.QuadVertexArray, s_Data.QuadIndexCount);
	}

	void Hazel::Renderer2D::DrawQuad(const glm::vec2& position, const glm::vec2& size, const glm::vec4& color)
	{
		DrawQuad({ position.x, position.y, 0.0f }, size, color);
	}

	void Hazel::Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const glm::vec4& color)
	{
		HZ_PROFILE_FUNCTION();

		const float textureIndex = 0.0f; // 白色纹理
		const float tilingFactor = 1.0f;

		// quad的左下角为起点
		s_Data.QuadVertexBufferPtr->Position = position;
		s_Data.QuadVertexBufferPtr->Color = color;
		s_Data.QuadVertexBufferPtr->TexCoord = { 0.0f, 0.0f };
		s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
		s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
		s_Data.QuadVertexBufferPtr++;

		s_Data.QuadVertexBufferPtr->Position = { position.x + size.x, position.y, 0.0f };
		s_Data.QuadVertexBufferPtr->Color = color;
		s_Data.QuadVertexBufferPtr->TexCoord = { 1.0f, 0.0f };
		s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
		s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
		s_Data.QuadVertexBufferPtr++;

		s_Data.QuadVertexBufferPtr->Position = { position.x + size.x, position.y + size.y, 0.0f };
		s_Data.QuadVertexBufferPtr->Color = color;
		s_Data.QuadVertexBufferPtr->TexCoord = { 1.0f, 1.0f };
		s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
		s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
		s_Data.QuadVertexBufferPtr++;

		s_Data.QuadVertexBufferPtr->Position = { position.x, position.y + size.y , 0.0f };
		s_Data.QuadVertexBufferPtr->Color = color;
		s_Data.QuadVertexBufferPtr->TexCoord = { 0.0f, 1.0f };
		s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
		s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
		s_Data.QuadVertexBufferPtr++;

		s_Data.QuadIndexCount += 6;// 每一个quad用6个索引

		//s_Data.TextureShader->SetFloat4("u_Color", color);
		//s_Data.TextureShader->SetFloat("u_TilingFactor", 1.0f);
		// 绑定纹理
		//s_Data.WhiteTexture->Bind();

		// 设置transform
		/*glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
			glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });

		s_Data.TextureShader->SetMat4("u_Transform", tranform);

		s_Data.QuadVertexArray->Bind();		// 绑定顶点数组
		RenderCommand::DrawIndexed(s_Data.QuadVertexArray);*/
	}
	void Renderer2D::DrawQuad(const glm::vec2& position, const glm::vec2& size, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
	{
		DrawQuad({ position.x, position.y, 0.0f }, size, texture, tilingFactor, tintColor);
	}
	void Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
	{
		HZ_PROFILE_FUNCTION();

		constexpr glm::vec4 color = { 1.0f, 1.0f, 1.0f, 1.0f };

		float textureIndex = 0.0f;
		for (uint32_t i = 1; i < s_Data.TextureSlotIndex; i++)
		{
			// 当前纹理，如果已经存储在纹理槽，就直接读取
			if (*s_Data.TextureSlots[i].get() == *texture.get()) {
				textureIndex = (float)i;
				break;
			}
		}
		if (textureIndex == 0.0f) {
			textureIndex = (float)s_Data.TextureSlotIndex;
			s_Data.TextureSlots[s_Data.TextureSlotIndex] = texture;
			s_Data.TextureSlotIndex++;// 记得++
		}
		// quad的左下角为起点
		s_Data.QuadVertexBufferPtr->Position = position;
		s_Data.QuadVertexBufferPtr->Color = color;
		s_Data.QuadVertexBufferPtr->TexCoord = { 0.0f, 0.0f };
		s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
		s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
		s_Data.QuadVertexBufferPtr++;

		s_Data.QuadVertexBufferPtr->Position = { position.x + size.x, position.y, 0.0f };
		s_Data.QuadVertexBufferPtr->Color = color;
		s_Data.QuadVertexBufferPtr->TexCoord = { 1.0f, 0.0f };
		s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
		s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
		s_Data.QuadVertexBufferPtr++;

		s_Data.QuadVertexBufferPtr->Position = { position.x + size.x, position.y + size.y, 0.0f };
		s_Data.QuadVertexBufferPtr->Color = color;
		s_Data.QuadVertexBufferPtr->TexCoord = { 1.0f, 1.0f };
		s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
		s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
		s_Data.QuadVertexBufferPtr++;

		s_Data.QuadVertexBufferPtr->Position = { position.x, position.y + size.y , 0.0f };
		s_Data.QuadVertexBufferPtr->Color = color;
		s_Data.QuadVertexBufferPtr->TexCoord = { 0.0f, 1.0f };
		s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
		s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
		s_Data.QuadVertexBufferPtr++;

		s_Data.QuadIndexCount += 6;// 每一个quad用6个索引

#if OLD_PATH
		s_Data.TextureShader->SetFloat4("u_Color", tintColor);
		s_Data.TextureShader->SetFloat("u_TilingFactor", tilingFactor);
		// 绑定纹理
		texture->Bind();

		// 设置transform
		glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
			glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });

		s_Data.TextureShader->SetMat4("u_Transform", tranform);

		s_Data.QuadVertexArray->Bind();		// 绑定顶点数组
		RenderCommand::DrawIndexed(s_Data.QuadVertexArray);
#endif // 0
	}
	void Renderer2D::DrawrRotatedQuad(const glm::vec2& position, const glm::vec2& size, float rotation, const glm::vec4& color)
	{
		DrawrRotatedQuad({position.x, position.y, 0.0f}, size, rotation, color);
	}
	void Renderer2D::DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const glm::vec4& color)
	{
		HZ_PROFILE_FUNCTION();

		s_Data.TextureShader->SetFloat4("u_Color", color);
		s_Data.TextureShader->SetFloat("u_TilingFactor", 1.0f);

		// 绑定纹理
		s_Data.WhiteTexture->Bind();

		// 设置transform
		glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
			glm::rotate(glm::mat4(1.0f), rotation, { 0.0f, 0.0f, 1.0f }) *
			glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });

		s_Data.TextureShader->SetMat4("u_Transform", tranform);

		s_Data.QuadVertexArray->Bind();		// 绑定顶点数组
		RenderCommand::DrawIndexed(s_Data.QuadVertexArray);
	}
	void Renderer2D::DrawrRotatedQuad(const glm::vec2& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
	{
		DrawrRotatedQuad({ position.x, position.y, 0.0f }, size, rotation, texture, tilingFactor, tintColor);
	}
	void Renderer2D::DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
	{
		HZ_PROFILE_FUNCTION();

		s_Data.TextureShader->SetFloat4("u_Color", tintColor);
		s_Data.TextureShader->SetFloat("u_TilingFactor", tilingFactor);
		// 绑定纹理
		texture->Bind();

		// 设置transform
		glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
			glm::rotate(glm::mat4(1.0f), rotation, { 0.0f, 0.0f, 1.0f }) *
			glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });

		s_Data.TextureShader->SetMat4("u_Transform", tranform);

		s_Data.QuadVertexArray->Bind();		// 绑定顶点数组
		RenderCommand::DrawIndexed(s_Data.QuadVertexArray);
	}
}
```

