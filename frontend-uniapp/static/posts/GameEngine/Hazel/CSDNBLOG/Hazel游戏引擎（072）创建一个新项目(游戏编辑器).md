> 文中若有代码、术语等错误，欢迎指正

[toc]

# 前言

- 此节目的

  需要一个新项目, 用来做**可视化界面**，构建游戏

  原先的Sandbox项目，用来测试引擎接口

# 创建新项目步骤

修改premake文件、给premake添加一个新工程、并将Sanbox的可视化界面功能移过来

# BUG：ImGui上显示OpenGL渲染的图像

- Bug说明

  可视化界面的wasd摄像机移动，显示相反（按a却成d的效果）。

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307044.png)

- Bug分析

  由于imgui的uv默认是左下角为01，右下角为11，左上角为00，右上角是10（起始点在左上角）

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307866.png)

  而我们绘制的quad的uv是左下角为00，右下角10，左上角01，右上角11（起始点在左下角）

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307878.png)

- 如何调整。

  ```cpp
  /*
  	imgui的uv默认是左下角为01，右下角为11，左上角为00，右上角是10
  	
      ImVec2(0, 1):设置左上角点的uv是 0 1
      ImVec2(1, 0):设置右下角点的uv是 1 0
      因为我们绘制的quad的uv是左下角为00，右下角10，左上角01，右上角11。
  */
  ImGui::Image((void*)textureID, ImVec2( 1280, 720 ), ImVec2(0, 1), ImVec2(1, 0));
  ```

- 结果如下：

  ![](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202307302307885.png)

