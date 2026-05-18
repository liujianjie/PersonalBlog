> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- Cherno所提到

  作为图形引擎，应该先呈现巨大的绘画能力，而不是先搞性能。

  （tips: Drawcall命令太多会降低性能，所以就有了批处理，批处理**兼顾**绘画能力与性能，但侧重于绘画能力）

- 063节之前批处理设计带来的问题

  1. 上一节完成带渲染的批渲染api，现在要考虑的是绘画很多图形

  2. 而我们的CPU**开的内存**不够，当需要**第二次**批处理时会导致引擎崩溃

  3. 所以需要提升我的api，提高健壮性

     当绘画的图形所占的内存**超过**我们得预先给定的空间，应该**分两次**Drawcall

     第二次drawcall时候需要**重置内存数据**，以便能开始**下一轮**批处理。

# 此节代码思路

1. 需要知道当前渲染信息

   ```cpp
   // 当前渲染的信息
   struct Statistics {
       uint32_t DrawCalls = 0;
       uint32_t QuadCount = 0;
   
       uint32_t GetTotalVertexCount() { return QuadCount * 4; }
       uint32_t GetTotalIndexCount() { return QuadCount * 6; }
   };
   struct Renderer2DData {
       ......
   
       Renderer2D::Statistics Stats;
   };
   ```

2. 设置最大绘制数量

   ```cpp
   struct Renderer2DData {
       static const uint32_t MaxQuads = 2;// 一次绘制多少个Quad
       .....
   
       Renderer2D::Statistics Stats
           ;
   };
   ```

3. 当绘画的图形所占的内存**超过**我们得预先给定的空间，需要**有判定**（提交渲染和重置）

   ```cpp
   if (s_Data.QuadIndexCount >= Renderer2DData::MaxIndices) {// 判断需要提交渲染和重置
       FlushAndReset();
   }
   ......
   s_Data.QuadIndexCount += 6;// 每一个quad用6个索引
   
   s_Data.Stats.QuadCount++;
   ```

4. 当一次渲染超过这个数量，分两次渲染，第二次渲染时候需要**重置内存数据**

   ```cpp
   // 内存不够为了分批渲染要做的drawcall绘制和重置
   void Renderer2D::FlushAndReset()
   {
       EndScene();
   	
       // 初始化:此帧 要绘制的索引数量，上传的顶点数据
       s_Data.QuadIndexCount = 0;
       // 指针赋予
       s_Data.QuadVertexBufferPtr = s_Data.QuadVertexBufferBase;
       // 纹理信息重置
       s_Data.TextureSlotIndex = 1;
   }
   void Renderer2D::EndScene{
       // 计算上传大小
       uint32_t dataSize = (uint8_t*)s_Data.QuadVertexBufferPtr - (uint8_t*)s_Data.QuadVertexBufferBase;
       s_Data.QuadVertexBuffer->SetData(s_Data.QuadVertexBufferBase, dataSize);
   
       Flush();
   }
   void Renderer2D::Flush(){
       // Bind textures
       for (uint32_t i = 0; i < s_Data.TextureSlotIndex; i++)
           s_Data.TextureSlots[i]->Bind(i);
   	
       RenderCommand::DrawIndexed(s_Data.QuadVertexArray, s_Data.QuadIndexCount);
       s_Data.Stats.DrawCalls++;
   }
   .........................
   void OpenGLVertexBuffer::SetData(const void* data, uint32_t size){
       glBindBuffer(GL_ARRAY_BUFFER, m_RendererID);
       /*
       	GL_ARRAY_BUFFER：这是目标缓冲区对象的类型
       	0：这是缓冲区对象中的偏移量（以字节为单位），表示从哪里开始更新数据
       	sizeof(data)：这是要从 CPU 内存复制到 GPU 缓冲区的数据的大小（以字节为单位）。
       	&data：这是指向 CPU 内存中数据的指针，表示要从哪里复制数据
       */
       glBufferSubData(GL_ARRAY_BUFFER, 0, size, data);// 从cpu的data开始位置的范围： [0, 0 + size]的 数据，上传给顶点缓冲区 
   }
   ```

5. 调用绘制Render2D API代码

   ```cpp
   void Sandbox2D::OnUpdate(Hazel::Timestep ts)
   {
       HZ_PROFILE_FUNCTION();
   
       m_CameraController.OnUpdate(ts);
   
       // 渲染信息初始化
       Hazel::Renderer2D::ResetStats();
   
       ......
   
       Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
       Hazel::Renderer2D::DrawrRotatedQuad({ 1.0f, 0.5f }, { 0.8f, 0.8f },30.0f, m_FlatColor);
       Hazel::Renderer2D::DrawQuad({ -1.0f, 0.0f }, { 0.8f, 0.8f }, m_FlatColor);
       Hazel::Renderer2D::DrawQuad({ 0.5f, -0.5f }, { 0.5f, 0.8f }, {0.2f, 0.8f, 0.9f, 1.0f});
       Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, -0.1f }, { 20.0f, 20.0f }, m_SquareTexture, 10.0f);
       Hazel::Renderer2D::DrawrRotatedQuad({ -0.5f, -1.5f, 0.0f }, { 1.0f, 1.0f }, rotation, m_SquareTexture, 20.0f);
       Hazel::Renderer2D::EndScene();
       ......
   ```

6. 代码效果

   如ImGui窗口信息显示：

   共有5个图形，设置最多一次渲染最多绘制**2**个图形，则需分**3**次渲染，即调用**3**次DrawCall命令

   ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823793.png)

# 测试

## 测试1：根据设置分析绘制信息结果

- 设置

  最多一次渲染最多绘制2个图形

- 绘制分析

  1. 有405个图形，但设置了最多一次渲染最多绘制**2**个图形，且分了两个Scene（BeginScene)
  2. 第一个Scene有**5**个图形，需要调用**3**次DrawCall
  3. 第二个Scene有**400**个图形，需分**200**次渲染

  即共调用**203**次DrawCall命令。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823358.png)

## 测试2：设置最大绘制数量的表现性能

绘制代码

```cpp
// 开启新的绘制，会重置绘制内存
Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
for (float y = -5.0f; y < 5.0f; y += 0.1f) {
    for (float x = -5.0f; x < 5.0f; x += 0.1f)
    {
        glm::vec4 color = { (x + 5.0f) / 10.0f, 0.4f , (y + 5.0f) /10.0f , 0.7f };
        Hazel::Renderer2D::DrawQuad({ x, y }, {0.45f, 0.45f}, color);
    }
}
Hazel::Renderer2D::EndScene();
```

- 设置1：最大绘制数量**2**

  绘制10206个图形**卡顿**，有5104次drawcall

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823357.png)

- 设置2：最大绘制数量**10000**

  绘制10206个图形**不卡顿**，只有3次drawcall

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823365.png)

# 完整代码

- Sandbox2D.cpp

  ```cpp
  void Sandbox2D::OnUpdate(Hazel::Timestep ts)
  {
  	HZ_PROFILE_FUNCTION();
  
  	m_CameraController.OnUpdate(ts);
  
  	// 渲染信息初始化
  	Hazel::Renderer2D::ResetStats();
  
  	{
  		HZ_PROFILE_SCOPE("Renderer Prep");
  		Hazel::RenderCommand::SetClearColor({ 0.1f, 0.1f, 0.1f, 1 });
  		Hazel::RenderCommand::Clear();
  	}
  	{
  		HZ_PROFILE_SCOPE("Renderer Draw");
  
  		static float rotation = 0.0f;
  		rotation += ts * 50.0f;
  
  		Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
  		Hazel::Renderer2D::DrawrRotatedQuad({ 1.0f, 0.5f }, { 0.8f, 0.8f },30.0f, m_FlatColor);
  		Hazel::Renderer2D::DrawQuad({ -1.0f, 0.0f }, { 0.8f, 0.8f }, m_FlatColor);
  		Hazel::Renderer2D::DrawQuad({ 0.5f, -0.5f }, { 0.5f, 0.8f }, {0.2f, 0.8f, 0.9f, 1.0f});
  		Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, -0.1f }, { 20.0f, 20.0f }, m_SquareTexture, 10.0f);
  		Hazel::Renderer2D::DrawrRotatedQuad({ -0.5f, -1.5f, 0.0f }, { 1.0f, 1.0f }, rotation, m_SquareTexture, 20.0f);
  		Hazel::Renderer2D::EndScene();
  
  		// 开启新的绘制，会重置绘制内存
  		Hazel::Renderer2D::BeginScene(m_CameraController.GetCamera());
  		for (float y = -5.0f; y < 5.0f; y += 0.1f) {
  			for (float x = -5.0f; x < 5.0f; x += 0.1f)
  			{
  				glm::vec4 color = { (x + 5.0f) / 10.0f, 0.4f , (y + 5.0f) /10.0f , 0.7f };
  				Hazel::Renderer2D::DrawQuad({ x, y }, {0.45f, 0.45f}, color);
  			}
  		}
  		Hazel::Renderer2D::EndScene();
  	}
  }
  ```

- Renderer2D

  ```cpp
  #pragma once
  
  #include "OrthographicCamera.h"
  #include "Texture.h"
  namespace Hazel {
  	class Renderer2D
  	{
  	public:
  		static void Init();
  		static void Shutdown();
  
  		static void BeginScene(const OrthographicCamera& camera);
  		static void EndScene();
  		static void Flush();
  
  		// 源语
  		static void DrawQuad(const glm::vec2& position, const glm::vec2& size, const glm::vec4& color);
  		static void DrawQuad(const glm::vec3& position, const glm::vec2& size, const glm::vec4& color);
  		static void DrawQuad(const glm::vec2& position, const glm::vec2& size, const Ref<Texture2D>& texture, float tilingFactor = 1.0f, const glm::vec4& tintColor = glm::vec4(1.0f));
  		static void DrawQuad(const glm::vec3& position, const glm::vec2& size, const Ref<Texture2D>& texture, float tilingFactor = 1.0f, const glm::vec4& tintColor = glm::vec4(1.0f));
  		// 旋转
  		static void DrawrRotatedQuad(const glm::vec2& position, const glm::vec2& size, float rotation, const glm::vec4& color);
  		static void DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const glm::vec4& color);
  		static void DrawrRotatedQuad(const glm::vec2& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor = 1.0f, const glm::vec4& tintColor = glm::vec4(1.0f));
  		static void DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor = 1.0f, const glm::vec4& tintColor = glm::vec4(1.0f));
  
  		// 当前渲染的信息
  		struct Statistics {
  			uint32_t DrawCalls = 0;
  			uint32_t QuadCount = 0;
  
  			uint32_t GetTotalVertexCount() { return QuadCount * 4; }
  			uint32_t GetTotalIndexCount() { return QuadCount * 6; }
  		};
  		static void ResetStats();
  		static Statistics GetStats();
  	private:
  		static void FlushAndReset();// 内存不够为了分批渲染要做的drawcall绘制和重置
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "Renderer2D.h"
  #include "VertexArray.h"
  #include "Buffer.h"
  #include "Shader.h"
  #include "Texture.h"
  #include "RenderCommand.h"
  #include <glm/gtc/matrix_transform.hpp>
  #include <glm/glm.hpp>
  
  namespace Hazel {
      struct QuadVertex {
          glm::vec3 Position;
          glm::vec4 Color;
          glm::vec2 TexCoord;
          float TexIndex;
          float TilingFactor;
      };
      struct Renderer2DData {
          static const uint32_t MaxQuads = 2;
          static const uint32_t MaxVertices = MaxQuads * 4;
          static const uint32_t MaxIndices = MaxQuads * 6;
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
  
          glm::vec4 QuadVertexPosition[4];
  
          Renderer2D::Statistics Stats;
      };
      static Renderer2DData s_Data;
      ......
  
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
  
          // 初始化此帧要绘制的索引数量，上传的顶点数据
          s_Data.QuadIndexCount = 0;
          // 指针赋予
          s_Data.QuadVertexBufferPtr = s_Data.QuadVertexBufferBase;
          // 纹理信息重置
          s_Data.TextureSlotIndex = 1;
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
          // 调用绘画命令
          RenderCommand::DrawIndexed(s_Data.QuadVertexArray, s_Data.QuadIndexCount);
          s_Data.Stats.DrawCalls++;
      }
      // 内存不够为了分批渲染要做的drawcall绘制和重置
      void Renderer2D::FlushAndReset()
      {
          EndScene();
  
          // 初始化此帧要绘制的索引数量，上传的顶点数据
          s_Data.QuadIndexCount = 0;
          // 指针赋予
          s_Data.QuadVertexBufferPtr = s_Data.QuadVertexBufferBase;
          // 纹理信息重置
          s_Data.TextureSlotIndex = 1;
      }
      ......
          void Renderer2D::DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
      {
          HZ_PROFILE_FUNCTION();
  
          if (s_Data.QuadIndexCount >= Renderer2DData::MaxIndices) {
              FlushAndReset();
          }
  
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
          // 设置transform
          glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
              glm::rotate(glm::mat4(1.0f), glm::radians(rotation), { 0.0f, 0.0f, 1.0f }) *
              glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
  
          // quad的左下角为起点
          s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[0];
          s_Data.QuadVertexBufferPtr->Color = color;
          s_Data.QuadVertexBufferPtr->TexCoord = { 0.0f, 0.0f };
          s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
          s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
          s_Data.QuadVertexBufferPtr++;
  
          s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[1];
          s_Data.QuadVertexBufferPtr->Color = color;
          s_Data.QuadVertexBufferPtr->TexCoord = { 1.0f, 0.0f };
          s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
          s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
          s_Data.QuadVertexBufferPtr++;
  
          s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[2];
          s_Data.QuadVertexBufferPtr->Color = color;
          s_Data.QuadVertexBufferPtr->TexCoord = { 1.0f, 1.0f };
          s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
          s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
          s_Data.QuadVertexBufferPtr++;
  
          s_Data.QuadVertexBufferPtr->Position = tranform * s_Data.QuadVertexPosition[3];
          s_Data.QuadVertexBufferPtr->Color = color;
          s_Data.QuadVertexBufferPtr->TexCoord = { 0.0f, 1.0f };
          s_Data.QuadVertexBufferPtr->TexIndex = textureIndex;
          s_Data.QuadVertexBufferPtr->TilingFactor = tilingFactor;
          s_Data.QuadVertexBufferPtr++;
  
          s_Data.QuadIndexCount += 6;// 每一个quad用6个索引
  
          s_Data.Stats.QuadCount++;
  
          #if OLD_PATH
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
          #endif
  
      }
      void Renderer2D::ResetStats()
      {
          memset(&s_Data.Stats, 0, sizeof(Statistics));
      }
      Renderer2D::Statistics Renderer2D::GetStats()
      {
          return s_Data.Stats;
      }
  }
  ```




# 065测试Hazel引擎性能

- 前言

  - 有一位观看者用Hazel引擎实现了像80年代风格的2D游戏。游戏是由很多很多的quad组成的一张巨大的地图，关卡数量从顶到底逐次递增，每个关卡由墙壁隔开，需要操作主角移动，找到通往下一关的入口，但这个过程中有怪物和石头下落。
  - 这个游戏因为绘制了很多很多的quad，且又是游戏形式，所以是个不错的**测试试验**。

- 在这游戏中，Hazel为什么在**Debug**模式运行**慢**（帧间隔200ms左右 10fps左右），在**Release**运行**快**（2.0ms左右 300fps左右）

  主要原因：

  1. Hazel中有矩阵相乘运算，这**数学运算**很占非常占时间
  2. 在Debug模式下并没有使用SSC（不知道有无记错）这些优化，从而保持矩阵运算保持原有速度
  3. 而Release模式下可以使用SSC，什么**SMID**加速优化，从而导致计算时间下降，使游戏运行快。

- VS的性能查看器

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823973.png)

  ![2.性能查看器](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823332.png)

  ![3.1性能查看器](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823200.png)

  ![3.性能查看器](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823981.png)

  ![4.性能查看器](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823979.png)

  ![5.性能查看器](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231824411.png)

  
