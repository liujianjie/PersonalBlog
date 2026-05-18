> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  为了物理效果能可以运行，这节需要完成工具栏的UI，点击播放运行和停止物理效果（后几节做）。

- 如何实现

  使用ImGui的API，渲染OpenGL的加载纹理

- 实现细节

  - 按钮应该在**中间**
  - 按钮适应窗口大小、放大时应使用**线性**插值保证不那么模糊
  - 按钮图片透明背景
  - 按钮针对hover、click有不同效果

# 关键代码+代码流程

- 设置好按钮，点击按钮切换状态

  ```cpp
  void EditorLayer::UI_Toolbar() {
      // padding
      ImGui::PushStyleVar(ImGuiStyleVar_WindowPadding, ImVec2(0, 2));
      ImGui::PushStyleVar(ImGuiStyleVar_ItemInnerSpacing, ImVec2(0, 0));
      // 按钮图片透明背景
      ImGui::PushStyleColor(ImGuiCol_Button, ImVec4(0, 0, 0, 0));
      auto& colors = ImGui::GetStyle().Colors;
      // 按钮针对hover、click有不同效果
      const auto& buttonHovered = colors[ImGuiCol_ButtonHovered];
      ImGui::PushStyleColor(ImGuiCol_ButtonHovered, ImVec4(buttonHovered.x, buttonHovered.y, buttonHovered.z, 0.5f));
      const auto& buttonActive = colors[ImGuiCol_ButtonActive];
      ImGui::PushStyleColor(ImGuiCol_ButtonActive, ImVec4(buttonActive.x, buttonActive.y, buttonActive.z, 0.5f));
  
      ImGui::Begin("##toolbar", nullptr, ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_NoScrollbar | ImGuiWindowFlags_NoScrollWithMouse);
      // 按钮适应窗口大小、放大时应使用线性插值保证不那么模糊
      float size = ImGui::GetWindowHeight() - 4.0f;
      Ref<Texture2D> icon = m_SceneState == SceneState::Edit ? m_IconPlay : m_IconStop;
      // 按钮应该在中间
      ImGui::SetCursorPosX((ImGui::GetWindowContentRegionMax().x * 0.5f) - (size * 0.5f));// 设置按钮的x位置
      if (ImGui::ImageButton((ImTextureID)icon->GetRendererID(), ImVec2(size, size), ImVec2(0, 0), ImVec2(1, 1), 0)) { // padding为0，好像没有区别
          //if (ImGui::ImageButton((ImTextureID)icon->GetRendererID(), ImVec2(size, size))) {
          if (m_SceneState == SceneState::Edit) {
              OnScenePlay();
          }
          else if (m_SceneState == SceneState::Play) {
              OnSceneStop();
          }
      }
      ImGui::PopStyleVar(2);
      ImGui::PopStyleColor(3);
      ImGui::End();
  }
  ```

- 根据当前不同状态，Scene调用不同函数渲染静态场景、动态场景（物理效果）

  ```cpp
  	void EditorLayer::OnUpdate(Timestep ts)
  	{
  		HZ_PROFILE_FUNCTION();
  		.....
  		// 渲染信息初始化
  		Renderer2D::ResetStats();
  		{
  			HZ_PROFILE_SCOPE("Renderer Prep");
  			// 将渲染的东西放到帧缓冲中
  			m_Framebuffer->Bind();
  			.....
  			HZ_PROFILE_SCOPE("Renderer Draw");
  
  			// Scene更新
  			switch (m_SceneState) {
  				case SceneState::Edit: {
  					// 当焦点聚焦，才能wasd
  					if (m_ViewportFocused) {
  						m_CameraController.OnUpdate(ts);
  					}
  					// 不需要焦点，每一帧都需要刷新
  					m_EditorCamera.OnUpdate(ts);
  					m_ActiveScene->OnUpdateEditor(ts, m_EditorCamera);
  					break;
  				}
  				case SceneState::Play: {
  					m_ActiveScene->OnUpdateRuntime(ts);
  					break;
  				}
  			}
  ```

# 效果

- 原始效果

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130005985.png)

- 外padding为2，内padding为0

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130005995.png)

- 透明背景

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202308130005616.png)