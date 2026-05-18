> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节所做

  由067节写的代码，写死在cpp文件中，为此需要抽象纹理SheetAPI。

- 如何抽象SheetAPI

  - 具体怎么实现和抽象根据自己的需要

  - Cherno采用的思路是

    - 为一张Texture Sheet，根据输入**xy**、**大小**参数返回子纹理。

    - 子纹理的属性有：Texture（即一张的大的Texture Sheet）指针、glm::vec2 的纹理坐标

      Texture是指针，不是每一个子纹理都有一个指针指向父纹理。

# 代码流程

1. 加载Texture sheet纹理集

   ```cpp
   // 加载Texture sheet
   m_SpriteSheet = Hazel::Texture2D::Create("assets/games/textures/RPGpack_sheet_2X.png");
   ```

2. 由纹理集对象创建子纹理

   ```cpp
   //m_TextureStairs, m_TextureTree, m_TextureBush
   m_TextureStair = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 7, 6 }, {128, 128});
   m_TextureBush = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 2, 3 }, { 128, 128 });
   m_TextureTree = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 4, 1 }, { 128, 128 }, { 1,2 });
   ```

   ```cpp
   /////////////////////////////////////////////////////////
   // 为一张Texture Sheet，根据输入**xy**、**大小**参数返回子纹理。
   Ref<SubTexture2D> Hazel::SubTexture2D::CreateFromCoords(const Ref<Texture2D>& texture, const glm::vec2& coords, const glm::vec2& cellSize, const glm::vec2& spriteSize)
   {
       glm::vec2 min = { (coords.x * cellSize.x) / texture->GetWidth(),  (coords.y * cellSize.y) / texture->GetHeight() };
       glm::vec2 max = { ((coords.x + spriteSize.x) * cellSize.x) / texture->GetWidth(),  ((coords.y + spriteSize.y) * cellSize.y) / texture->GetHeight() };
       return CreateRef<SubTexture2D>(texture, min, max);
   }
   ```

3. 将根据获取的子纹理的属性赋予顶点属性上传到OpenGL着色器上渲染

   ```cpp
   Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
   // 获取的子纹理有m_TextureBush、m_TextureStair、m_TextureTree
   Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, 0.9f }, { 1.0f, 1.0f }, m_TextureBush, 1.0f);
   Hazel::Renderer2D::DrawQuad({ 1.0f, 0.0f, 0.9f }, { 1.0f, 1.0f }, m_TextureStair, 1.0f);
   Hazel::Renderer2D::DrawQuad({ -1.0f, 0.0f, 0.9f }, { 1.0f, 2.0f }, m_TextureTree, 1.0f);
   Hazel::Renderer2D::EndScene();
   ```

   ```cpp
   void Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const Ref<SubTexture2D>& subtexture, float tilingFactor, const glm::vec4& tintColor)
   {
       HZ_PROFILE_FUNCTION();
   
       constexpr glm::vec4 color = { 1.0f, 1.0f, 1.0f, 1.0f };
       /////////////////////////////////////////////////////
       // 根据子纹理对象获取属性：纹理坐标、所属的纹理集对象
       const glm::vec2* textureCoords = subtexture->GetTexCoords();
       const Ref<Texture2D> texture = subtexture->GetTexture();
     .....
       // quad的左下角为起点
       s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[0];
       s_Data.QuadVertexBufferPtr->Color = color;
       s_Data.QuadVertexBufferPtr->TexCoord = textureCoords[0];// 子纹理坐标赋予到顶点属性纹理坐标中
       s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;	// 纹理集在纹理数组的位置
       s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
       s_Data.QuadVertexBufferPtr++;
      ......
       s_Data.Stats.QuadCount++;
   }
   ```

# 结果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302305528.png)

# 完整代码

- SubTexture2D

  ```cpp
  #pragma once
  
  #include "Texture.h"
  #include <glm/glm.hpp>
  namespace Hazel {
  	class SubTexture2D
  	{
  	public:
  		SubTexture2D(const Ref<Texture2D>& texture, const glm::vec2& min, const glm::vec2& max);
  
  		const Ref<Texture2D> GetTexture()const { return m_Texture; }
  		const glm::vec2* GetTexCoords() const { return m_TextCoords; }
  
  		static Ref<SubTexture2D> CreateFromCoords(const Ref<Texture2D>& texture, const glm::vec2& coords, const glm::vec2& cellSize, const glm::vec2& spriteSize = {1, 1});
  	private:
  		Ref<Texture2D> m_Texture;
  
  		glm::vec2 m_TextCoords[4];
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "SubTexture2D.h"
  
  namespace Hazel {
  	// 只需要min和max二个二维向量可以组合成4个点
  	Hazel::SubTexture2D::SubTexture2D(const Ref<Texture2D>& texture, const glm::vec2& min, const glm::vec2& max)
  		:m_Texture(texture)
  	{
  		m_TextCoords[0] = { min.x, min.y };
  		m_TextCoords[1] = { max.x, min.y };
  		m_TextCoords[2] = { max.x, max.y };
  		m_TextCoords[3] = { min.x, max.y };
  	}
  
  	Ref<SubTexture2D> Hazel::SubTexture2D::CreateFromCoords(const Ref<Texture2D>& texture, const glm::vec2& coords, const glm::vec2& cellSize, const glm::vec2& spriteSize)
  	{
  		glm::vec2 min = { (coords.x * cellSize.x) / texture->GetWidth(),  (coords.y * cellSize.y) / texture->GetHeight() };
  		glm::vec2 max = { ((coords.x + spriteSize.x) * cellSize.x) / texture->GetWidth(),  ((coords.y + spriteSize.y) * cellSize.y) / texture->GetHeight() };
  		return CreateRef<SubTexture2D>(texture, min, max);
  	}
  }
  ```

- Renderer2D.cpp

  ```cpp
  void Renderer2D::DrawQuad(const glm::vec3& position, const glm::vec2& size, const Ref<SubTexture2D>& subtexture, float tilingFactor, const glm::vec4& tintColor)
  {
      HZ_PROFILE_FUNCTION();
  
      constexpr glm::vec4 color = { 1.0f, 1.0f, 1.0f, 1.0f };
      const glm::vec2* textureCoords = subtexture->GetTexCoords();
      const Ref<Texture2D> texture = subtexture->GetTexture();
  
      if (s_Data.QuadIndexCount >= Renderer2DData::MaxIndices) {
          FlushAndReset();
      }
  
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
      // 设置transform
      glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
          glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
      // quad的左下角为起点
      s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[0];
      s_Data.QuadVertexBufferPtr->Color = color;
      s_Data.QuadVertexBufferPtr->TexCoord = textureCoords[0];
      s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
      s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
      s_Data.QuadVertexBufferPtr++;
  
      s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[1];
      s_Data.QuadVertexBufferPtr->Color = color;
      s_Data.QuadVertexBufferPtr->TexCoord = textureCoords[1];
      s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
      s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
      s_Data.QuadVertexBufferPtr++;
  
      s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[2];
      s_Data.QuadVertexBufferPtr->Color = color;
      s_Data.QuadVertexBufferPtr->TexCoord = textureCoords[2];
      s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
      s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
      s_Data.QuadVertexBufferPtr++;
  
      s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[3];
      s_Data.QuadVertexBufferPtr->Color = color;
      s_Data.QuadVertexBufferPtr->TexCoord = textureCoords[3];
      s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
      s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
      s_Data.QuadVertexBufferPtr++;
  
      s_Data.QuadIndexCount += 6;// 每一个quad用6个索引
  
      s_Data.Stats.QuadCount++;
  }
  ```

- Sandbox2D.cpp

  ```cpp
  void Sandbox2D::OnAttach()
  {
  	HZ_PROFILE_FUNCTION();
  
  	//Hazel::Renderer2D::Init();
  	m_SquareTexture = Hazel::Texture2D::Create("assets/textures/Checkerboard.png");
  	// 加载Texture sheet
  	m_SpriteSheet = Hazel::Texture2D::Create("assets/games/textures/RPGpack_sheet_2X.png");
  	//m_TextureStairs, m_TextureTree, m_TextureBush
  	m_TextureStair = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 7, 6 }, {128, 128});
  	m_TextureBush = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 2, 3 }, { 128, 128 });
  	m_TextureTree = Hazel::SubTexture2D::CreateFromCoords(m_SpriteSheet, { 4, 1 }, { 128, 128 }, { 1,2 });
  	// Init here
  	m_Particle.ColorBegin = { 254 / 255.0f, 212 / 255.0f, 123 / 255.0f, 1.0f };
  .....
  }
  
  
  OnUpdate()
  // 绘制纹理集的一个
  Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
  Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, 0.9f }, { 1.0f, 1.0f }, m_TextureBush, 1.0f);
  Hazel::Renderer2D::DrawQuad({ 1.0f, 0.0f, 0.9f }, { 1.0f, 1.0f }, m_TextureStair, 1.0f);
  Hazel::Renderer2D::DrawQuad({ -1.0f, 0.0f, 0.9f }, { 1.0f, 2.0f }, m_TextureTree, 1.0f);
  Hazel::Renderer2D::EndScene();
  ```

  

