> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节要做什么

  在065节，Cherno看到别人用Hazel创建了一个2D小游戏

  所以他也想用Hazel创建一些东西的能力（也只是想法，没有做）

  之前他用Hazel做了一个flybird的游戏，想到创建2D小游戏，引擎需要具有绘制粒子效果的能力

  所以此节需要完成Hazel能实现绘制粒子效果。

- 实现粒子系统相关重点

  - 粒子系统

    - 发射点属性
    - 一个个粒子的属性

  - 鼠标点击转换为世界空间的**位置**

    这个位置确定粒子的**发射点**

- 2D粒子完整代码链接

  https://github.com/TheCherno/OneHourParticleSystem

# 2D粒子系统

## 文字讲解2D粒子生成流程

1. 用户点击屏幕，获取鼠标位置，将其转换世界坐标**位置**
2. 将这个世界坐标位置设置为粒子的**发射点**
3. 这发射点进行**准备**发射多个对应的**粒子**
4. 对应的粒子根据**发射点**初始化时设置的属性，进行**初始化**
5. 粒子根据属性**更新状态**（位置，角度，是否存活）
6. 然后上传**粒子属性**给OpenGL**绘制**Quad图形（不存活的不绘制即可）。

每个粒子是一个独立体（类的对象），都有自己的属性：有是否存活、xy轴的重力加速度、存活时间。

## 代码讲解2D粒子生成流程

- 点击屏幕，获取鼠标位置，将其转换世界坐标（1），将这个世界坐标位置设置为粒子的**发射点**（2），这发射点进行**准备**发射多个对应的**粒子**（3）

  ```c++
  void SandboxLayer::OnUpdate(Timestep ts)
  {
  	m_CameraController.OnUpdate(ts);
  	// Render here
  	//glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
  	glClearColor(0,0,0, 1.0f);
  	glClear(GL_COLOR_BUFFER_BIT);
  	// 鼠标位置转换成世界空间
  	if (GLCore::Input::IsMouseButtonPressed(HZ_MOUSE_BUTTON_LEFT))
  	{
          // 点击屏幕，获取鼠标位置，将其转换世界坐标（1）
  		auto [x, y] = Input::GetMousePosition();
  		auto width = GLCore::Application::Get().GetWindow().GetWidth();
  		auto height = GLCore::Application::Get().GetWindow().GetHeight();
  
  		auto bounds = m_CameraController.GetBounds();
  		auto pos = m_CameraController.GetCamera().GetPosition();
  		x = (x / width) * bounds.GetWidth() - bounds.GetWidth() * 0.5f;
  		y = bounds.GetHeight() * 0.5f - (y / height) * bounds.GetHeight();
  		m_Particle.Position = { x + pos.x, y + pos.y };
  		for (int i = 0; i < 5; i++)
              // 将这个世界坐标位置设置为粒子的**发射点**（2），这发射点开始依照初始化时设置的属性，进行**准备**发射多个对应的**粒子**（3）
  			m_ParticleSystem.Emit(m_Particle);
  	}
  
  	m_ParticleSystem.OnUpdate(ts);
  	m_ParticleSystem.OnRender(m_CameraController.GetCamera());
  }
  ```

- 对应的粒子根据**发射点**初始化时设置的属性，进行**初始化**（4）

  ```c++
  void ParticleSystem::Emit(const ParticleProps& particleProps)
  {
  	Particle& particle = m_ParticlePool[m_PoolIndex];
  	particle.Active = true;
  	particle.Position = particleProps.Position;
  	particle.Rotation = Random::Float() * 2.0f * glm::pi<float>();
  
  	// Velocity
  	particle.Velocity = particleProps.Velocity;
  	// 在x正负2个方向，和y正负2个方向上的重力加速度，
  	particle.Velocity.x += particleProps.VelocityVariation.x * (Random::Float() - 0.5f); 
  	particle.Velocity.y += particleProps.VelocityVariation.y * (Random::Float() - 0.5f);
  
  	// Color
  	particle.ColorBegin = particleProps.ColorBegin;
  	particle.ColorEnd = particleProps.ColorEnd;
  
  	particle.LifeTime = particleProps.LifeTime;
  	particle.LifeRemaining = particleProps.LifeTime;
  	particle.SizeBegin = particleProps.SizeBegin + particleProps.SizeVariation * (Random::Float() - 0.5f);
  	particle.SizeEnd = particleProps.SizeEnd;
  
  	// 这里：由于m_ParticlePool.size();返回无符号整形，所以，-1 % 无符号整形为正数，但是不会回到999下标，只回到小于999的下标
  	m_PoolIndex = --m_PoolIndex % m_ParticlePool.size();
  }
  ```

- 粒子根据属性**更新状态**（位置，角度，是否存活）（5)

  ```c++
  // 更新一个个粒子的信息
  void ParticleSystem::OnUpdate(GLCore::Timestep ts)
  {
  	int i = m_ParticlePool.size() - 1;
  	for (auto& particle : m_ParticlePool)
  	{
  		i--;
  		if (!particle.Active) {
  			std::cout << "当前 " << i <<" 无 激活" << std::endl;
  			continue;
  		}
  
  		std::cout << "当前 " << i << "  有 激活*" << std::endl;
  		if (particle.LifeRemaining <= 0.0f)
  		{
  			particle.Active = false;
  			continue;
  		}
  
  		particle.LifeRemaining -= ts;
  		particle.Position += particle.Velocity * (float)ts;
  		particle.Rotation += 0.01f * ts;
  	}
  }
  ```

- 上传**粒子属性**给OpenGL**绘制**Quad图形，根据标记是否要销毁决定要不要绘制：要销毁即不绘制。（6）

  ```c++
  // 绘制一个个粒子
  void ParticleSystem::OnRender(GLCore::Utils::OrthographicCamera& camera)
  {
  ......
  	glUseProgram(m_ParticleShader->GetRendererID());
  	glUniformMatrix4fv(m_ParticleShaderViewProj, 1, GL_FALSE, glm::value_ptr(camera.GetViewProjectionMatrix()));
  
  	for (auto& particle : m_ParticlePool)
  	{	// 当粒子标记为不存活，则不再绘制
  		if (!particle.Active)
  			continue;
  
  		// Fade away particles
  		float life = particle.LifeRemaining / particle.LifeTime;
  		glm::vec4 color = glm::lerp(particle.ColorEnd, particle.ColorBegin, life);
  		//color.a = color.a * life;
  		// 线性插值
  		float size = glm::lerp(particle.SizeEnd, particle.SizeBegin, life);
  		
          // 上传**粒子属性**给OpenGL**绘制**Quad图形
  		// Render
  		glm::mat4 transform = glm::translate(glm::mat4(1.0f), { particle.Position.x, particle.Position.y, 0.0f })
  			* glm::rotate(glm::mat4(1.0f), particle.Rotation, { 0.0f, 0.0f, 1.0f })
  			* glm::scale(glm::mat4(1.0f), { size, size, 1.0f });
  		glUniformMatrix4fv(m_ParticleShaderTransform, 1, GL_FALSE, glm::value_ptr(transform));
  		glUniform4fv(m_ParticleShaderColor, 1, glm::value_ptr(color));
  		glBindVertexArray(m_QuadVA);
  		glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, nullptr);
  	}
  }
  ```


## 2D粒子正确的效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823880.png)

粒子池大小为：50000

彩色正方形：400个Quad

其它：5个Quad

所以在效果图左上角的Quads：50405 = 50000 + 400 + 5

## 2D粒子系统的Bug

- 关于a%b取模，左右两个操作数a与b会影响结果

  设a = **-1,** b = 最大的粒子数（**无符号**整数）

  a % b= 不超过 b 的无符号整数 **c** ，0 < c < b

  这样会使**超过c**的**小于b**的这区间（c < x < b) 的粒子闲置

  ![image-20230723170808528](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823872.png)

- Bug处代码

  ```c++
  void ParticleSystem::Emit(const ParticleProps& particleProps)
  {
  	Particle& particle = m_ParticlePool[m_PoolIndex];
  	particle.Active = true;
  	......
  
  	// 这里：由于m_ParticlePool.size();返回无符号整形，所以，-1 % 无符号整形为正数，但是不会回到999下标，只回到小于999的下标
  	m_PoolIndex = --m_PoolIndex % m_ParticlePool.size();
  }
  ```

- 测试运行结果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823879.png)

  如图，取模后只回到**79**，而大于79的粒子处于无激活状态，无法利用起来

# 引入粒子系统进Hazel项目

## Bug1：具有粒子空闲

- 设置粒子池大小为500

- bug1的效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231824952.png)

- 观察Settings窗口

  彩色正方形：400个Quad

  其它：5个Quad

  所以屏幕上显示的粒子Quad有：701 - 405 = **296**左右，而最大数量明明是**500**。

  说明有200个粒子是**空闲**的

- 如何解决此Bug

  ```cpp
  m_PoolIndex = --m_PoolIndex % m_ParticlePool.size();
  换成
  m_PoolIndex = m_PoolIndex == 0 ? (m_ParticlePool.size() - 1) : --m_PoolIndex % m_ParticlePool.size();
  ```

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231824570.png)

  彩色正方形：400个Quad

  其它：5个Quad

  粒子池大小为：500

  所以在效果图的settings窗口显示的Quads：905= 400+ 5+ 500 

  说明**无闲置**。

## Bug2：解决Bug1后产生 残留绘画

- 使用以上代码，虽然没有闲置的粒子，但是却会有残留绘画的图形，如下：

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231823855.png)

- 不完美的解决方法：

  将代码改为

  ```cpp
  m_PoolIndex = m_PoolIndex == 0 ? (m_ParticlePool.size() / 2) : --m_PoolIndex % m_ParticlePool.size();
  ```

  虽然没有残留图形，但是**又回到了bug1**，有**一半**的空闲的粒子，不知道为什么。！！！

  后面发现是：批处理的代码问题，更新批处理的代码就不会有Bug2，并且保留无空闲粒子

## 引入粒子Hazel项目改变

- OrthographicCameraController

  引入struct边界，为了粒子发射点的**世界坐标**。

  ```cpp
  namespace Hazel {
  	struct OrthographicCameraBounds
  	{
  		float Left, Right;
  		float Bottom, Top;
  
  		float GetWidth() { return Right - Left; }
  		float GetHeight() { return Top - Bottom; }
  	};
  
  	class OrthographicCameraController
  	{
  ```

  ```cpp
  Hazel::OrthographicCameraController::OrthographicCameraController(float aspectRatio, bool rotation)
      :m_AspectRatio(aspectRatio), m_Bounds({ -m_AspectRatio * m_ZoomLevel, m_AspectRatio * m_ZoomLevel, -m_ZoomLevel, m_ZoomLevel }), m_Camera(m_Bounds.Left, m_Bounds.Right, m_Bounds.Bottom, m_Bounds.Top), m_Rotation(rotation)
      {
      }
  bool Hazel::OrthographicCameraController::OnMouseScrolled(MouseScrolledEvent& e)
  {
      HZ_PROFILE_FUNCTION();
  
      m_ZoomLevel -= e.GetYOffset() * 0.25f;
      m_ZoomLevel = std::max(m_ZoomLevel, 0.25f);
      m_Bounds = { -m_AspectRatio * m_ZoomLevel, m_AspectRatio * m_ZoomLevel, -m_ZoomLevel, m_ZoomLevel };
      m_Camera.SetProjection(m_Bounds.Left, m_Bounds.Right, m_Bounds.Bottom, m_Bounds.Top);
      return false;
  }
  bool Hazel::OrthographicCameraController::OnWindowResized(WindowResizeEvent& e)
  {
      HZ_PROFILE_FUNCTION();
  
      m_AspectRatio = (float)e.GetWidth() / (float)e.GetHeight();
      m_Bounds = { -m_AspectRatio * m_ZoomLevel, m_AspectRatio * m_ZoomLevel, -m_ZoomLevel, m_ZoomLevel };
      m_Camera.SetProjection(m_Bounds.Left, m_Bounds.Right, m_Bounds.Bottom, m_Bounds.Top);
      return false;
  }
  ```

- 新建ParticleSystem类，引入粒子文件h和cpp代码

  ```cpp
  #pragma once
  
  #include "Hazel.h"
  
  // 发射点属性
  struct ParticleProps
  {
  	glm::vec2 Position;
  	glm::vec2 Velocity, VelocityVariation;
  	glm::vec4 ColorBegin, ColorEnd;
  	float SizeBegin, SizeEnd, SizeVariation;
  	float LifeTime = 1.0f;
  };
  
  class ParticleSystem
  {
  public:
  	ParticleSystem();
  
  	void OnUpdate(Hazel::Timestep ts);
  	void OnRender(Hazel::OrthographicCamera& camera);
  
  	void Emit(const ParticleProps& particleProps);
  private:
  	// 一个个粒子属性
  	struct Particle
  	{
  		glm::vec2 Position;
  		glm::vec2 Velocity;
  		glm::vec4 ColorBegin, ColorEnd;
  		float Rotation = 0.0f;
  		float SizeBegin, SizeEnd;
  
  		float LifeTime = 1.0f;
  		float LifeRemaining = 0.0f;
  
  		bool Active = false;
  	};
  	std::vector<Particle> m_ParticlePool;// 粒子池
  	uint32_t m_PoolIndex = 999;
  };
  ```

  OnUpdate、OnRender、Emit这三个方法在前讲解2D粒子生成流程有

  主要修改OnRender：用Renderer2D渲染类开启关闭场景、绘制Quad粒子

  ```cpp
  // 添加random类到此文件中，避免多一个文件，random只有此文件需要用
  
  // 绘制一个个粒子
  void ParticleSystem::OnRender(Hazel::OrthographicCamera& camera)
  {
  	Hazel::Renderer2D::BeginScene(camera);
  	for (auto& particle : m_ParticlePool)
  	{// 当粒子标记为不存活，则不再绘制
  		if (!particle.Active)
  			continue;
  
  		// Fade away particles
  		float life = particle.LifeRemaining / particle.LifeTime;
  		glm::vec4 color = glm::lerp(particle.ColorEnd, particle.ColorBegin, life);
  		//color.a = color.a * life;
  		// 线性插值
  		float size = glm::lerp(particle.SizeEnd, particle.SizeBegin, life);
  
  		glm::vec3 position = { particle.Position.x, particle.Position.y, 0.2f };
  		// 渲染 Rotation is radius
  		Hazel::Renderer2D::DrawrRotatedQuad(position, { size, size }, particle.Rotation, color);
  	}
  	Hazel::Renderer2D::EndScene();
  }
  ```

- Sandbox2D

  ```cpp
  #include "Hazel.h"
  #include "ParticleSystem.h"
  
  class Sandbox2D :public Hazel::Layer
  {
  ......
  	ParticleProps m_Particle;// 发射点
  	ParticleSystem m_ParticleSystem;
  };
  ```

  ```cpp
  void Sandbox2D::OnUpdate(Hazel::Timestep ts)
  {
  ......
  	// 鼠标位置转换成世界空间
  	if (Hazel::Input::IsMouseButtonPressed(HZ_MOUSE_BUTTON_LEFT))
  	{
  		auto [x, y] = Hazel::Input::GetMousePosition();
  		auto width = Hazel::Application::Get().GetWindow().GetWidth();
  		auto height = Hazel::Application::Get().GetWindow().GetHeight();
  
  		auto bounds = m_CameraController.GetBounds();
  		auto pos = m_CameraController.GetCamera().GetPosition();
  		x = (x / width) * bounds.GetWidth() - bounds.GetWidth() * 0.5f;
  		y = bounds.GetHeight() * 0.5f - (y / height) * bounds.GetHeight();
  		m_Particle.Position = { x + pos.x, y + pos.y };
  		for (int i = 0; i < 5; i++)
  			m_ParticleSystem.Emit(m_Particle);
  	}
  	m_ParticleSystem.OnUpdate(ts);
  	m_ParticleSystem.OnRender(m_CameraController.GetCamera());
  }
  ```
