> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  当ImGui视口大小发生改变时，场景中所有实体所拥有的摄像机都能正确的设置**宽高比**，**使图像不会变形**。

- 在080中根据实体camera摄像机组件的camera来更新渲染图形的顶点

  但是没有写调整**摄像机组件**的摄像机宽高比的代码，相对的摄像机类行为也很少，所以

  - 此节所作

    - 新建了一个SceneCamera类继承自Camera类，作为摄像机组件的摄像机类属性
    - 视口改变，场景内所有摄像机都能更新宽高比

  - 图形变形bug

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302310101.png)

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302310106.png)

- 与之前区别

  之前是EditorLayer层拥有一个OrthographicCameraController m_CameraController**正交摄像机**，当ImGui视口改变大小，这个摄像机会调整宽高比。

  但是080节把摄像机类当作实体的组件，所以**缺少**更新实体摄像机组件的宽高比

- 此节改后与之前的对比

  |            |          此节          |        之前         |
  | :--------: | :--------------------: | :-----------------: |
  |  什么改变  |          视口          |        视口         |
  |   谁响应   | 场景里的所有摄像机组件 | EditorLayer的摄像机 |
  | 几个摄像头 |          多个          |         1个         |

# 代码流程

- 添加一个实体

  ```cpp
  EditorLayer.h
  Entity m_CameraEntity;			// 摄像机实体
  ```

- 实体添加摄像机组件，在构造函数中根据默认值计算正交投影矩阵

  ```cpp
  void EditorLayer::OnAttach(){
      m_CameraEntity = m_ActiveScene->CreateEntity("Camera Entity");
      m_CameraEntity.AddComponent<CameraComponent>();
   	.....   
  }
  ```

- 视口和帧缓冲的大小不一致，更新场景内的所有摄像机投影矩阵

  ```cpp
  void EditorLayer::OnUpdate(Timestep ts){
      // 窗口resize，在每一帧检测
      if (FramebufferSpecification spec = m_Framebuffer->GetSpecification();
          m_ViewportSize.x > 0.0f && m_ViewportSize.y > 0.0f &&
          (spec.Width != m_ViewportSize.x || spec.Height != m_ViewportSize.y)) {
          // 调整帧缓冲区大小
          m_Framebuffer->Resize((uint32_t)m_ViewportSize.x, (uint32_t)m_ViewportSize.y);
          // 调整摄像机投影：之前调整EditorLayer的摄像机宽高比代码
          m_CameraController.OnResize(m_ViewportSize.x, m_ViewportSize.y);
          //////////////////////////////////////////////////
          // 调整场景内的摄像机:此节所作
          m_ActiveScene->OnViewportResize((uint32_t)m_ViewportSize.x, (uint32_t)m_ViewportSize.y);
      }
      ......
  ```

  ```cpp
      void Scene::OnViewportResize(uint32_t width, uint32_t height)
      {
          m_ViewportWidth = width;
          m_ViewportHeight = height;
  
          auto view = m_Registry.view<CameraComponent>();
          for (auto entity : view) {
              auto& cameraComponent = view.get<CameraComponent>(entity);
              if (!cameraComponent.fixedAspectRatio) {
                  cameraComponent.camera.SetViewportSize(width, height);
              }
          }
      }
  ```

# 相关代码

- 修改了Camera.h

  ```cpp
  #pragma once
  #include <glm/glm.hpp>
  namespace Hazel {
  	class Camera {
  	public:
  		Camera() = default;
  		virtual ~Camera() = default;
  		Camera(const glm::mat4& projection)
  			: m_Projection(projection){}
  		const glm::mat4& GetProjection() const { return m_Projection; }
  		// TOOD:做透视投影
  	protected:
  		glm::mat4 m_Projection = glm::mat4(1.0f);
  	};
  }
  ```

- 新添加了SceneCamera

  ```cpp
  #pragma once
  #include "Hazel/Renderer/Camera.h"
  
  namespace Hazel {
      class SceneCamera : public Camera
      {
      public:
          SceneCamera();
          virtual ~SceneCamera() = default;
          
          void SetOrthographic(float size, float nearClip, float farClip);
          
          void SetViewportSize(uint32_t width, uint32_t height);
  
          float GetOrthographicSize() const { return m_OrthographicSize; }
          void SetOrthographicSize(float size)  { m_OrthographicSize = size; RecalculateProjection();}
  
      private:
          void RecalculateProjection();
      private:
          float m_OrthographicSize = 10.0f;
          float m_OrthographicNear = -1.0f, m_OrthographicFar = 1.0f;
  
          float m_AspectRatio = 0.0f;
      };
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "SceneCamera.h"
  
  #include <glm/gtc/matrix_transform.hpp>
  
  namespace Hazel {
  	SceneCamera::SceneCamera()
  	{
  		RecalculateProjection();
  	}
  	void SceneCamera::SetOrthographic(float size, float nearClip, float farClip)
  	{
  		m_OrthographicSize = size;
  		m_OrthographicNear = nearClip;
  		m_OrthographicFar = farClip;
  		RecalculateProjection();
  	}
  	void SceneCamera::SetViewportSize(uint32_t width, uint32_t height)
  	{
  		m_AspectRatio = (float)width / (float)height;
  		RecalculateProjection();
  	}
      ////////////////////////////////////////////////////////
      // 根据m_OrthographicSize来计算宽高比与父类Camera的投影矩阵
  	void SceneCamera::RecalculateProjection()
  	{
          // TODO:根据父类的类型来计算正交投影矩阵还是透视投影矩阵
  		float orthoLeft = -m_OrthographicSize * m_AspectRatio * 0.5f;
  		float orthoRight = m_OrthographicSize * m_AspectRatio * 0.5f;
  		float orthoBottom = -m_OrthographicSize * 0.5f;
  		float orthoTop = m_OrthographicSize * 0.5f;
  		// 设置父类Camera的投影矩阵
  		m_Projection = glm::ortho(orthoLeft, orthoRight, orthoBottom,
  			orthoTop, m_OrthographicNear, m_OrthographicFar);
  	}
  }
  ```

- 为什么要保持Camera类不变，而新建SceneCamera类**继承Camera类**

  因为Camera有个**属性m_Projection投影矩阵**，这是正交摄像机和透视摄像机**通用的投影矩阵属性**，所以再分下一级。

  在子类的RecalculateProjection函数中

  - 如果父类是正交摄像机

    计算camera的**正交**投影矩阵

  - 若是父类是透视摄像机

    计算camera的**透视**投影矩阵

# ScenCamera与之前的OrthographicCamera对比

初始化默认值与变量名字替换

- OrthographicCamera

  ```cpp
  m_AspectRatio = 1280.0f / 720.0f = 1.7；
  
  m_ZoomLevel = 1.0f;	// 相当于ScenCamera的m_OrthographicSize
  m_Projection = glm::ortho(-m_AspectRatio * m_ZoomLevel, m_AspectRatio * m_ZoomLevel, -m_ZoomLevel, m_ZoomLevel, -1.0f, 1.0f);
  ```

- ScenCamera

  ```cpp
  // 这里初始化为0，是因为在layer层的onupdate中每帧会检测更新大小，这个值在窗口出现时计算
  float m_AspectRatio = 0.0f;
  // 相当于OrthographicCamera的m_ZoomLevel
  m_OrthographicSize=10.0f;// 用来放大还是放缩	
  // OrthographicCamera是默认值，这里用变量表示
  m_OrthographicNear=-1.0f,m_OrthographicFar = 1.0f;
  
  // 这里的m_OrthographicSize除了一半，相当于5，而OrthographicCamera的m_ZoomLevel不会除以一半
  float orthoLeft = -m_OrthographicSize * m_AspectRatio * 0.5f;
  float orthoRight = m_OrthographicSize * m_AspectRatio * 0.5f;
  float orthoBottom = -m_OrthographicSize * 0.5f;
  float orthoTop = m_OrthographicSize * 0.5f;
  
  m_Projection = glm::ortho(orthoLeft, orthoRight, orthoBottom,
  orthoTop, m_OrthographicNear, m_OrthographicFar);
  ```

# 效果图

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302310107.png)

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302310595.png)

第二个摄像机

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302310084.png)
