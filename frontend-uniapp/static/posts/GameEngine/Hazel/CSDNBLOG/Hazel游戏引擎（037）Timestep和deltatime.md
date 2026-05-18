> 文中若有代码、术语等错误，欢迎指正

[TOC]

# 前言

- 此节目的

  为了修复36节在OnUpdate中每帧移动旋转摄像机，由于不同电脑的**刷新率**不同，从而使得在不同配置下的机器显示的不一致。

- Cherno画的图

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022044109.png)

- 问题举例与解决

  - 问题描述

    若规定每帧移动速度为speed = 60m/s

    若屏幕的HZ为**60**帧，那么它1秒会移动60次，60 * speed = 3600m

    若屏幕的HZ为**100**帧，那么它1秒会移动100次，100*speed = 6000m

  - 计算deltatime

    HZ为60的，1/60 = 0.01666666

    HZ为100的，1/100 = 0.01

  - 解决方法：**乘以deltatime**

    规定每帧移动速度为speed = **60**m/s

    若屏幕的HZ为60帧，那么它1秒会移动60次，60 * speed * deltatime(1/60) = **60**m

    若屏幕的HZ为100帧，那么它1秒会移动100次，100*speed * deltatime(1/100)= **60**m

  - 公式

    **S = HZ * 1 / HZ * speed = speed**

    不管什么显示器，得出1秒的每一帧的间隔时间，乘以速度，在1秒内的路程是一样的。

    这样就与现实世界的时间联系起来了。

  - **理论**计算deltatime与**实际**写代码计算deltatime：以60HZ举例（自己推的，大概率有误）

    deltatime**理论**上等于1/60帧（每帧平均时间），但**实际**代码上deltatime是==两帧之间的**间隔时间**==。

    - 这样<font color="red">一帧</font>移动的**实际**距离为：

      S = 1 * deltatime * speed = deltatime * speed

    - 1秒内渲染实际的帧数(60)，移动的**理论**距离为：

      S = deltatime * speed * 60 = 1 / 60 * speed * 60 = speed

    注意细节在于 实际 与 理论 距离

# 项目相关

## 代码

- Timestep.h

  ```cpp
  namespace Hazel {
  	class Timestep{
  	public:
  		Timestep(float time = 0.0f)
  			: m_Time(time){}
  		operator float() const { return m_Time; }	// 类型转换函数
  		float GetSeconds() const { return m_Time; }
  		float GetMilliseconds() const { return m_Time * 1000.0f; }
  	private:
  		float m_Time;
  	};
  }
  ```

  由于Timestep实现了operator float()；类型转换函数。

  这个Timestep类就相当于float一样了，可以不用引用。

- Application

  ```cpp
  void Application::Run(){
      while (m_Running){
          // 计算两帧间隔时间
          float time = (float)glfwGetTime();	// 是从应用开始计算总共的时间
          Timestep timestep = time - m_LastFrameTime;
          m_LastFrameTime = time;
  
          // 从前往后顺序更新层
          for (Layer* layer : m_LayerStack)
              layer->OnUpdate(timestep);
  ```

- SandboxApp

  ```cpp
  void OnUpdate(Hazel::Timestep ts) override{
      HZ_TRACE("DeltaTime:{0}, millionTime({1})", ts, ts.GetMilliseconds());
      if (Hazel::Input::IsKeyPressed(HZ_KEY_LEFT))
          m_CameraPosition.x -= m_CameraMoveSpeed * ts;
      else if (Hazel::Input::IsKeyPressed(HZ_KEY_RIGHT))
          m_CameraPosition.x += m_CameraMoveSpeed * ts;
  
      if (Hazel::Input::IsKeyPressed(HZ_KEY_UP))
          m_CameraPosition.y += m_CameraMoveSpeed * ts;
      else if (Hazel::Input::IsKeyPressed(HZ_KEY_DOWN))
          m_CameraPosition.y -= m_CameraMoveSpeed * ts;
  
      if (Hazel::Input::IsKeyPressed(HZ_KEY_A))
          m_CameraRotation += m_CameraRotationSpeed * ts;
      if (Hazel::Input::IsKeyPressed(HZ_KEY_D))
          m_CameraRotation -= m_CameraRotationSpeed * ts;
  ```

## 效果

![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022044983.png)

## 测试垂直同步下的DeltaTime

- WindowsWindow

  ```cpp
  	/*
  	　开启垂直同步,如果屏幕刷新率为60Hz，那么我们就有60FPS。
  	 我们可以通过在glfwSwapInterval方法中设置高于1的数字来降低这个速率（如果设置为2，将得到30FPS）。
  	 而我的电脑刷新率为144Hz，则
  	 0：关闭垂直同步 ; 1：144FPS ; 2：72FPS。
  	*/
  	void WindowsWindow::SetVSync(bool enabled) {
  		if (enabled) {
  			glfwSwapInterval(2); 
  		}
  		else {
  			glfwSwapInterval(0);
  		}
  		m_Data.VSync = enabled;
  	}
  ```

  这个SetVSync函数可以在一个显示器中模拟不同屏幕的刷新率，即：fps。

- m_Window->SetVSync(**false**);

  DeltaTime = 1/144 = 0.006.....

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022044584.png)

- m_Window->SetVSync(**true**);

  DeltaTime = 1/ 72 = 0.0138.............................

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307022045797.png)





