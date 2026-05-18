> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  在SandboxApp里面有camera移动旋转的方法，希望能将Camera抽象成一个**类**

  好处：更好的封装，这样在SandboxApp中就不需要写那么多方法。

# 测试宽高比对图形显示的效果

```cpp
Hazel::OrthographicCameraController::OrthographicCameraController(float aspectRatio, bool rotation)
    :m_AspectRatio(aspectRatio), m_Camera(-m_AspectRatio * m_ZoomLevel, m_AspectRatio* m_ZoomLevel,-m_ZoomLevel, m_ZoomLevel), m_Rotation(rotation)
    {
        /*
        	宽：m_Camera的第一个、第二个参数（不包含符号）。-m_AspectRatio * m_ZoomLevel、m_AspectRatio* m_ZoomLevel
        	高：m_Camera的第三个、第四个参数（不包含符号）。-m_ZoomLevel、m_ZoomLevel
        */
    }
```

- 宽=1，高=1。m_Camera（-1，1，-1,1）

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307092219220.png)

- 宽=1，高=2。m_Camera（-1，1，-2,2）

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231817949.png)

  看右上角的黄色方块，宽还是4个，**高明显增多**，所以，高变大代表**上下视角变大**，物体**高缩小**

- 宽=2，高=1。m_Camera（-2，2，-1,1）

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307231817873.png)

  看右上角的黄色方块，高还是4个，**宽明显增多**，所以，宽变大代表**左右视角变大**，物体**宽**缩小

# 关键代码

- 宽高比

  在1280*720下的界面，宽1280>高720，宽明显比高 像素占位**多**。

  需传入1280/720=1.7左右，将宽放大，从而**左右视角变大**，物体**宽**缩小（如上测试结果），达到正常比例。

  ```cpp
  // , m_Camera(-1.6f, 1.6f, -0.9f, 0.9f)
  ExampleLayer() : Layer("Example"), m_CameraController(1280.0f / 720.0f, true)
  ```

- m_ZoomLevel视野影响物体大小

  ```cpp
   m_Camera(-m_AspectRatio * m_ZoomLevel, m_AspectRatio* m_ZoomLevel,-m_ZoomLevel, m_ZoomLevel)
  ```

  - 视野**放大**，物体缩小
  - 视野**缩小**，物体放大

  由上的测试结果：第一第二参数放大那么物体宽**缩小**、第三第四参数放大那么物体高**缩小**

  所以：m_ZoomLevel视野放大，物体宽和高都缩小，反之视野缩小，物体放大。

- m_ZoomLevel视野影响摄像机移动速度

  ```cpp
  // 视野放大，摄像机移动速度变快，视野缩小，摄像机移动速度变慢
  m_CameraTranslationSpeed = m_ZoomLevel;
  ```

  - 视野**放大**，物体缩小，摄像机移动速度变**快**
  - 视野**缩小**，物体放大，摄像机移动速度变**慢**

# 代码修改

- OrthographicCameraController

  ```cpp
  #pragma once
  #include "Hazel/Renderer/OrthographicCamera.h"
  #include "Hazel/Core/Timestep.h"
  #include "Hazel/Events/ApplicationEvent.h"
  #include "Hazel/Events/MouseEvent.h"
  
  namespace Hazel {
  	class OrthographicCameraController
  	{
  	public:
  		OrthographicCameraController(float aspectRatio, bool rotation = false);
  
  		void OnUpdate(Timestep ts);
  		void OnEvent(Event& e);
  
  		OrthographicCamera& GetCamera() { return m_Camera; }
  		const OrthographicCamera& GetCamera() const { return m_Camera; }
  	private:
  		bool OnMouseScrolled(MouseScrolledEvent& e);
  		bool OnWindowResized(WindowResizeEvent& e);
  	private:
  		float m_AspectRatio;
  		float m_ZoomLevel = 1.0f;
  		OrthographicCamera m_Camera;  
  
  		bool m_Rotation;
  
  		glm::vec3 m_CameraPosition = { 0.0f, 0.0f, 0.0f };
  		float m_CameraRotation = 0.0f;
  		float m_CameraTranslationSpeed = 5.0f, m_CameraRotationSpeed = 180.0f;
  	};
  }
  ```

  ```cpp
  #include "hzpch.h"
  #include "OrthographicCameraController.h"
  #include "Input.h"
  #include "KeyCodes.h"
  namespace Hazel {
  	Hazel::OrthographicCameraController::OrthographicCameraController(float aspectRatio, bool rotation)
  		:m_AspectRatio(aspectRatio), m_Camera(-m_AspectRatio * m_ZoomLevel, m_AspectRatio* m_ZoomLevel,-m_ZoomLevel, m_ZoomLevel), m_Rotation(rotation)
  	{
  	}
  	void Hazel::OrthographicCameraController::OnUpdate(Timestep ts)
  	{
  		if (Input::IsKeyPressed(HZ_KEY_W)) {
  			m_CameraPosition.y += m_CameraTranslationSpeed * ts;
  		}
  		else if (Input::IsKeyPressed(HZ_KEY_S)) {
  			m_CameraPosition.y -= m_CameraTranslationSpeed * ts;
  		}
  		if (Input::IsKeyPressed(HZ_KEY_A)) {
  			m_CameraPosition.x -= m_CameraTranslationSpeed * ts;
  		}
  		else if (Input::IsKeyPressed(HZ_KEY_D)) {
  			m_CameraPosition.x += m_CameraTranslationSpeed * ts;
  		}
  		if (m_Rotation) {
  			if (Input::IsKeyPressed(HZ_KEY_Q)) {
  				m_CameraRotation += m_CameraRotationSpeed * ts; // 注意是+
  			}
  			else if (Input::IsKeyPressed(HZ_KEY_E)) {
  				m_CameraRotation -= m_CameraRotationSpeed * ts;
  			}
  			m_Camera.SetRotation(m_CameraRotation);
  		}
  		// 修改后要重新设置
  		m_Camera.SetPosition(m_CameraPosition);
  
  		// 视野放大，摄像机移动速度变快，视野缩小，摄像机移动速度变慢
  		m_CameraTranslationSpeed = m_ZoomLevel;
  	}	
  
  	void Hazel::OrthographicCameraController::OnEvent(Event& e)
  	{
  		EventDispatcher dispatcher(e);
  		dispatcher.Dispatch<MouseScrolledEvent>(HZ_BIND_EVENT_FN(OrthographicCameraController::OnMouseScrolled));
  		dispatcher.Dispatch<WindowResizeEvent>(HZ_BIND_EVENT_FN(OrthographicCameraController::OnWindowResized));
  	}
  
  	bool Hazel::OrthographicCameraController::OnMouseScrolled(MouseScrolledEvent& e)
  	{
  		m_ZoomLevel -= e.GetYOffset() * 0.25f;
  		m_ZoomLevel = std::max(m_ZoomLevel, 0.25f);
  		m_Camera.SetProjection(-m_AspectRatio * m_ZoomLevel, m_AspectRatio * m_ZoomLevel, -m_ZoomLevel, m_ZoomLevel);
  		return false;
  	}
  
  	bool Hazel::OrthographicCameraController::OnWindowResized(WindowResizeEvent& e)
  	{
  		m_AspectRatio = (float)e.GetWidth() / (float)e.GetHeight();
  		m_Camera.SetProjection(-m_AspectRatio * m_ZoomLevel, m_AspectRatio * m_ZoomLevel, -m_ZoomLevel, m_ZoomLevel);
  		return false;
  	}
  }
  ```

