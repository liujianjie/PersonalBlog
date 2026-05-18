> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 062与061写的批处理留下来的问题

  1. 批处理没有处理Quad旋转的函数
  2. 062 061设计的顶点位置是基于自身空间的，没有经过transform变换位置，所以**无旋转效果**

- 此节所做

  1. 处理Quad旋转函数

  2. 将顶点位置在**Cpu**上计算，通过transform矩阵（平移、缩放、旋转）变换到世界空间

     与060之前不同，之前将顶点从局部空间转换到世界空间是在GPU(GLSL代码）上运行的。

- 流程：

  1. 给所有quad以原点为初始位置（**局部空间**）

  2. 再接受旋转角度，用初始位置transform矩阵 = 平移\*旋转\*缩放，再乘以顶点转换到**世界空间**

     （提下，**写代码顺序**是：平移*缩放\*旋转，但**解读顺序**是：从右往左读，先进行缩放，再进行旋转最后平移)

  3. 将最终世界空间的位置上传到GLSL的顶点着色器阶段

# 关键地方

Renderer2D.cpp

```c++
void Renderer2D::DrawrRotatedQuad(const glm::vec3& position, const glm::vec2& size, float rotation, const Ref<Texture2D>& texture, float tilingFactor, const glm::vec4& tintColor)
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
    // 设置transform ///////////////////////////////////////////////////////
    glm::mat4 tranform = glm::translate(glm::mat4(1.0f), position) *
        glm::rotate(glm::mat4(1.0f), glm::radians(rotation), { 0.0f, 0.0f, 1.0f }) *
        glm::scale(glm::mat4(1.0f), { size.x, size.y, 1.0f });
	///////////////////////////////////////////////////////////////////////////////
    // 从局部空间转换到世界空间///////////////////////////////////////////////////////
    // quad的左下角为起点///////////////////////////////////////////////////////
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
}
```

Sandbox2D.cpp

```c++
void Sandbox2D::OnUpdate(Hazel::Timestep ts)
{
	HZ_PROFILE_FUNCTION();

	m_CameraController.OnUpdate(ts);
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
        // 棋盘纹理背景
		Hazel::Renderer2D::DrawQuad({ 0.0f, 0.0f, -0.1f }, { 10.0f, 10.0f }, m_SquareTexture, 10.0f);
        /////////////////////////////////////////////////////////////
        // 批处理加上会旋转的Quad//////////////////////////////////////
		Hazel::Renderer2D::DrawrRotatedQuad({ -0.5f, -0.5f, 0.0f }, { 1.0f, 1.0f }, rotation, m_SquareTexture, 20.0f);
		Hazel::Renderer2D::EndScene();
	}
}
```

# 小问题

当修改DrawQuad函数，将quad的顶点乘以transform矩阵时，之前代码绘制的图形会偏离

![偏离](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231822773.png)

# 结果

![结果](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823624.png)

# 批处理渲染小结

- 有个结构体包含顶点的各个信息（顶点位置、颜色、纹理、法线）

  1. 先在CPU为这个结构体创建一个很大的数组

  2. 有两个变量记录这个数组

  3. 一个变量是数组的**基位置**

  4. 一个变量是记录在数组中存储**最后一个顶点**的位置。

- 渲染的流程是开启一个场景，然后绘画物体

  1. 绘画物体不是立马将物体的顶点信息从cpu传递到gpu调用drawcall去绘制
  2. 而是会在CPU上先乘以世界矩阵计算物体在世界空间的顶点位置，以及其它顶点信息
  3. 然后存入之前开的结构体数组中，然后对应变量**前进**。
  4. 每绘制一个物体都执行这个操作，然后在结束一个场景时，或者在CPU存储的顶点数**超过**了结构体数组大小
  5. 那么就执行drawcall操作

- 将根据这两个变量（基位置和最后一个顶点的位置），传递**对应大小**的顶点信息（glBufferSubData函数）

  从CPU传递给GPU，然后OpenGL绘制
