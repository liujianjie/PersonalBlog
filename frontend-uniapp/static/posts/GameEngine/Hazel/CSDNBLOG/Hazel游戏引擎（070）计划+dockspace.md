> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- Cherno说他接下来想做的
  1. 使Hazel成为一个独立的工具
  2. 可以打开成窗口应用程序
  3. 可以操作程序添加场景
  4. 在场景上放入精灵、实体，再写脚本语言给实体添加一些行为
  5. 以及给实体添加组件
  6. 然后可以导出为游戏执行文件，可以在编辑器之外运行

# Dockspace

- 什么是dockspace

  imgui提供的可以停靠在窗口上，能够实现重新布局窗口的功能。

  参考[022.ImGui的Docking和Viewports](https://blog.csdn.net/qq_34060370/article/details/131388699)

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307693.png)

- **缺点**

  - 问题所在

    使用了Imgui的dockspace，Opengl绘制的场景不见了

  - 为什么

    因为imgui接管了窗口

  - 如何解决

    让Opengl渲染到**framebuffer**帧缓冲中，作为texture纹理，然后Imgui再渲染这个texture。

  - 变化

    - 原本图像是渲染到屏幕窗口上

      屏幕窗口**->**OpenGL渲染的图像。

    - 现在改后是渲染到ImGUi的界面上，屏幕窗口再渲染ImGui的界面，这样OpenGL渲染的图像**间接**显示在屏幕上

      屏幕窗口->ImGui界面->OpenGL渲染的图像

      而要实现这样的效果，就要用到[**帧缓冲framebuffer**](https://blog.csdn.net/qq_34060370/article/details/129507170)

  - 如下：

    Imgui可以单独渲染一个texture

    ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307764.png)

    上图是渲染一个加载的棋盘texture

    可以写成ImGui界面上显示一个由OpenGL渲染本该显示在屏幕窗口的图像

  - 代码：

    ```cpp
    void Sandbox2D::OnImgGuiRender()
    {
    	HZ_PROFILE_FUNCTION();
    
    	static bool dockspaceOpen = true;
    	static bool opt_fullscreen = true;
    	static bool opt_padding = false;
    	static ImGuiDockNodeFlags dockspace_flags = ImGuiDockNodeFlags_None;
    
    	// We are using the ImGuiWindowFlags_NoDocking flag to make the parent window not dockable into,
    	// because it would be confusing to have two docking targets within each others.
    	ImGuiWindowFlags window_flags = ImGuiWindowFlags_MenuBar | ImGuiWindowFlags_NoDocking;
    	if (opt_fullscreen)
    	{
    		const ImGuiViewport* viewport = ImGui::GetMainViewport();
    		ImGui::SetNextWindowPos(viewport->WorkPos);
    		ImGui::SetNextWindowSize(viewport->WorkSize);
    		ImGui::SetNextWindowViewport(viewport->ID);
    		ImGui::PushStyleVar(ImGuiStyleVar_WindowRounding, 0.0f);
    		ImGui::PushStyleVar(ImGuiStyleVar_WindowBorderSize, 0.0f);
    		window_flags |= ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoResize | ImGuiWindowFlags_NoMove;
    		window_flags |= ImGuiWindowFlags_NoBringToFrontOnFocus | ImGuiWindowFlags_NoNavFocus;
    	}
    
    	// When using ImGuiDockNodeFlags_PassthruCentralNode, DockSpace() will render our background
    	// and handle the pass-thru hole, so we ask Begin() to not render a background.
    	if (dockspace_flags & ImGuiDockNodeFlags_PassthruCentralNode)
    		window_flags |= ImGuiWindowFlags_NoBackground;
    
    	// Important: note that we proceed even if Begin() returns false (aka window is collapsed).
    	// This is because we want to keep our DockSpace() active. If a DockSpace() is inactive,
    	// all active windows docked into it will lose their parent and become undocked.
    	// We cannot preserve the docking relationship between an active window and an inactive docking, otherwise
    	// any change of dockspace/settings would lead to windows being stuck in limbo and never being visible.
    	if (!opt_padding)
    		ImGui::PushStyleVar(ImGuiStyleVar_WindowPadding, ImVec2(0.0f, 0.0f));
    	ImGui::Begin("DockSpace Demo", &dockspaceOpen, window_flags);
    	if (!opt_padding)
    		ImGui::PopStyleVar();
    
    	if (opt_fullscreen)
    		ImGui::PopStyleVar(2);
    
    	// Submit the DockSpace
    	ImGuiIO& io = ImGui::GetIO();
    	if (io.ConfigFlags & ImGuiConfigFlags_DockingEnable)
    	{
    		ImGuiID dockspace_id = ImGui::GetID("MyDockSpace");
    		ImGui::DockSpace(dockspace_id, ImVec2(0.0f, 0.0f), dockspace_flags);
    	}
    
    	if (ImGui::BeginMenuBar())
    	{
    		if (ImGui::BeginMenu("Options"))
    		{
    			if (ImGui::MenuItem("Exit")) Hazel::Application::Get().Close();
    			ImGui::EndMenu();
    		}
    		ImGui::EndMenuBar();
    	}
    	ImGui::End();
    
    	ImGui::Begin("Settings");
    	auto stats = Hazel::Renderer2D::GetStats();
    	ImGui::Text("Renderer2D Stats:");
    	ImGui::Text("Draw Calls: %d", stats.DrawCalls);
    	ImGui::Text("Quads: %d", stats.QuadCount);
    	ImGui::Text("Vertices: %d", stats.GetTotalVertexCount());
    	ImGui::Text("Indices: %d", stats.GetTotalIndexCount());
    
    	ImGui::ColorEdit4("Square Color", glm::value_ptr(m_FlatColor));
        /////////////////////////////////////////////////////////////
        /////////////////////////////////////////////////////////////
    	// imgui渲染一个棋盘纹理，在这里
    	uint32_t textureID = m_SquareTexture->GetRendererID();
    	ImGui::Image((void*)textureID, ImVec2(256.0f, 256.0f));
    
    	ImGui::End();
    }
    ```

    

  







