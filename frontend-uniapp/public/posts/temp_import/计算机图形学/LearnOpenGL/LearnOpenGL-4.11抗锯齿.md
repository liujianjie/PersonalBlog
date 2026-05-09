# 抗锯齿

- 锯齿图像

  ![](图片/4.11抗锯齿/1.立方体的边缘.png)

  ![](图片/4.11抗锯齿/anti_aliasing_zoomed.png)

  这种现象被称之为走样/锯齿(Aliasing)

- 抗锯齿方法

  - **超采样**抗锯齿**SSAA**

    - 简介

      更高分辨率来渲染场景，当图像输出到帧缓冲中时，分辨率会**下**采样到正常的分辨率

    - 缺点

      这样比平时要绘制更多的片段，它也会带来很大的**性能开销**

  - 多重采样抗锯齿MSAA(下一节介绍)

    借鉴SSAA背后的理念，并克服了SSAA的缺点

# 多重采样

## 锯齿产生原因

- 什么是光栅器

  - 光栅器是位于最终处理过的顶点**之后**到片段着色器**之前**所经过的所有的算法与过程的总和。

  - 光栅器会将一个图元的所有顶点作为输入，并将它转换为一系列的片段。

- 问题所在

  顶点坐标理论上可以取任意值，但片段不行，因为它们受限于你窗口的分辨率。

  顶点坐标与片段之间几乎永远也不会有一对一的映射，所以光栅器必须以某种方式来决定**每个顶点**最终所在的**片段/屏幕坐标**。

- 光栅器的处理方式

  ![](图片/4.11抗锯齿/anti_aliasing_rasterization.png)

  如图：

  - 这屏幕像素的网格，每个像素的中心包含有一个采样点，它会被用来决定这个三角形是否遮盖了某个像素。
  - **红色**的采样点被三角形所遮盖，在每一个遮住的像素处都会生成一个片段。
  - 在三角形边缘的一些部分也遮住了某些屏幕像素，但由于这个采样点并没有被三角形**内部**所遮盖，所以它们不会受到片段着色器的影响

  所以完整渲染后的三角形在屏幕上是：

  ![](图片/4.11抗锯齿/anti_aliasing_rasterization_filled.png)

  使用了不光滑的边缘来渲染图元，导致之前讨论到的锯齿边缘

## 多重采样方式

- 引出

  为了解决上述的锯齿，多重采样所做的正是将单一的采样点变为**多个**采样点

  ![](图片/4.11抗锯齿/anti_aliasing_sample_points.png)

  注意：它的工作方式并不是因为这4个采样点中有2个采样点被三角形覆盖，就需要运行2次片段着色器。

- 工作方式

  ![](图片/4.11抗锯齿/anti_aliasing_rasterization_samples.png)

  - 无论三角形遮盖了多少个子采样点，（每个图元中）每个像素只运行**一次**片段着色器。
  - 个人认为的流程（为了更容易理解而分这样的步骤，但很大概率有误）：
    - 每个片段的颜色会由顶点数据插值而得出，得出的颜色存储在每个片段的中心
    - 一个片段有4个采样点，这4个采样点的颜色都与片段中心的颜色一样
    - 当一个片段的**4个**采样点被三角形包围，则片段的最终颜色是**四个**采样点颜色相加除以4
    - 当一个片段有**两个**采样点被三角形包围，两个采样点在外面，则片段的最终颜色是会将**两个**采样点的颜色相加后除以4

  简单来说，一个像素中如果有更多的采样点被三角形遮盖，那么这个像素的颜色就会更接近于三角形的颜色。

  ![](图片/4.11抗锯齿/anti_aliasing_rasterization_samples_filled.png)

  对于每个像素来说，**越少**的子采样点被三角形所覆盖，那么它受到三角形颜色的影响就**越小**。
  
  三角形的不平滑边缘被稍浅的颜色所包围后，从远处观察时就会显得更加平滑了。

# OpenGL的MSAA

如果我们想要在OpenGL中使用MSAA，我们必须要使用一个能在每个像素中存储**大于1个**颜色值的颜色缓冲（因为多重采样需要我们为每个采样点都储存一个颜色）。

所以，我们需要一个新的缓冲类型，来存储特定数量的多重采样样本，它叫做**多重采样缓冲**(Multisample Buffer)。

## 例子：提示GLFW

- 由于我们项目用例glfw，而glfw给了我们这个功能，我们所要做的只是**提示**(Hint) GLFW，我们希望使用一个包含N个样本的多重采样缓冲。

- 代码

  ```cpp
  int main()
  {
      // glfw: initialize and configure
      // ------------------------------
      glfwInit();
      glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
      glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
      glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
      // 重点：提示使用多重采样////////////////////////////
      glfwWindowHint(GLFW_SAMPLES, 4);
  #ifdef __APPLE__
      glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
  #endif    
      // glfw window creation
      // 创建窗口时，每个屏幕坐标就会使用一个包含4个子采样点的颜色缓冲了
      GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGL", NULL, NULL);
      // 多重采样都是默认启用的，所以这个调用可能会有点多余，但显式地调用一下会更保险一点。
      glEnable(GL_MULTISAMPLE);
  ```

- 效果

  ![](图片/4.11抗锯齿/2.立方体的边缘-使用MSAA.png)

## 离屏MSAA

- 什么是离屏

  渲染到一个不是默认帧缓冲被叫做**离屏渲染**(Off-screen Rendering)。
  
- 如何实现离屏**MSAA**

  - 实现离屏

    将场景渲染到我们自己的**帧**缓冲中

  - 实现离屏MSAA

    给自己创建的帧换成添加**多重**纹理采样缓冲附件

  |                  | 默认的帧缓冲             | 自己创建的帧缓冲                     |
  | ---------------- | ------------------------ | ------------------------------------ |
  | 如何实现多重采样 | 提示GLFW使用多重采样即可 | 给帧缓冲添加**多重**纹理采样缓冲附件 |

- 如何创建多重采样缓冲附加到帧缓冲中

  - **创建**多重采样纹理缓冲附件

    ```cpp
    glBindTexture(GL_TEXTURE_2D_MULTISAMPLE, tex);
    glTexImage2DMultisample(GL_TEXTURE_2D_MULTISAMPLE, samples, GL_RGB, width, height, GL_TRUE);
    glBindTexture(GL_TEXTURE_2D_MULTISAMPLE, 0);
    ```

  - 将多重采样纹理缓冲附件**附加**到帧缓冲上

    ```cpp
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D_MULTISAMPLE, tex, 0);
    ```

### 例子1：多重采样帧缓冲传送到屏幕上

意思是将自定义帧缓冲多重采样颜色缓冲的图像复制给 默认 的帧缓冲

- 代码

  ```cpp
  float vertices[] = {
      -0.5f, -0.5f, -0.5f,
  	......
  };
  // cube
  unsigned int cubeVBO, cubeVAO;
  glGenVertexArrays(1, &cubeVAO);
  glGenBuffers(1, &cubeVBO);
  glBindBuffer(GL_ARRAY_BUFFER, cubeVBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  glBindVertexArray(cubeVAO);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  
  // 重点在这：自定义帧缓冲进行离屏渲染//////////////////////////////////////
  // 1.1创建帧缓冲
  unsigned int framebuffer;
  glGenFramebuffers(1, &framebuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
  // 1.2创建多重采样纹理缓冲附件
  unsigned int textureColorBufferMultiSampled;
  glGenTextures(1, &textureColorBufferMultiSampled);
  glBindTexture(GL_TEXTURE_2D_MULTISAMPLE, textureColorBufferMultiSampled);
  glTexImage2DMultisample(GL_TEXTURE_2D_MULTISAMPLE, 4, GL_RGB, SCR_WIDTH, SCR_HEIGHT, GL_TRUE);// 重点在这
  glBindTexture(GL_TEXTURE_2D_MULTISAMPLE, 0);
  // 1.3将此多重采样纹理缓冲附件附加到当前绑定的帧缓冲中
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D_MULTISAMPLE, textureColorBufferMultiSampled, 0);
  
  // render loop
  // -----------
  while (!glfwWindowShouldClose(window))
  {
      ......
      // 1.渲染场景到自定义的帧缓冲中
      glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
      glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
      glEnable(GL_DEPTH_TEST);
  
      glBindVertexArray(cubeVAO);
      glDrawArrays(GL_TRIANGLES, 0, 36);
  
      // 2.将自定义帧缓冲多重采样颜色缓冲的图像传给复制给 默认 的帧缓冲
      glBindFramebuffer(GL_READ_FRAMEBUFFER, framebuffer);// 源：自定义的帧缓冲
      glBindFramebuffer(GL_DRAW_FRAMEBUFFER, 0);          // 目标：默认的帧缓冲
      glBlitFramebuffer(0, 0, SCR_WIDTH, SCR_HEIGHT, 0, 0, SCR_WIDTH, SCR_HEIGHT, GL_COLOR_BUFFER_BIT, GL_NEAREST);
  
      glBindFramebuffer(GL_FRAMEBUFFER, 0);
      ......
  }
  ```

- 效果

  ![](图片/4.11抗锯齿/3.立方体的边缘-自定义帧缓冲多重采样.png)

### 例子2：采样多重采样帧缓冲的纹理缓冲与后期效果

- 目的

  使用帧缓冲的多重采样缓冲纹理附件，做像是**后期处理**这样的事情

- 说明

  我们不能直接在片段着色器中使用多重采样缓冲的纹理。

  但我们能做的是将多重采样**缓冲位块**传送到一个**没有**使用多重采样缓冲纹理附件的FBO（帧缓冲对象）中。

  然后用这个FBO的普通颜色缓冲附件来做后期处理，从而达到我们的目的。

  流程是：

  1. 一个带有多重采样缓冲附件的**帧缓冲**
  2. 一个带有普通颜色缓冲附件的**普通帧**（临时）缓冲
  3. 将帧缓冲的多重采样缓冲图像附件**复制**给临时帧缓冲的颜色缓冲附件中
  4. 将临时帧缓冲的颜色缓冲附件当做纹理给着色器采样（注意：需要先切回屏幕默认的帧缓冲，才能输出图像到屏幕上）

- 代码

  glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 1) in vec2 aTexCoords;
  
  out vec2 TexCoords;
  
  void main()
  {
      TexCoords = aTexCoords;
      gl_Position = vec4(aPos, 1.0);
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  in vec2 TexCoords;
  
  uniform sampler2D screenTexture;
  
  const float offset = 1.0 / 300.0;
  
  void main(){ 
      // 1.原本已经是平滑的了，不变输出即平滑的
      // vec3 col = texture(screenTexture, TexCoords).rgb;
  	// FragColor = vec4(vec3(col), 1.0);
  
      // 2.进行后期：模糊
      vec2 offsets[9] = vec2[](
          vec2(-offset,  offset), // 左上
          vec2( 0.0f,    offset), // 正上
          vec2( offset,  offset), // 右上
          vec2(-offset,  0.0f),   // 左
          vec2( 0.0f,    0.0f),   // 中
          vec2( offset,  0.0f),   // 右
          vec2(-offset, -offset), // 左下
          vec2( 0.0f,   -offset), // 正下
          vec2( offset, -offset)  // 右下
      );
      // 改变这个数组
      float kernel[9] = float[](
          1.0 / 16, 2.0 / 16, 1.0 / 16,
          2.0 / 16, 4.0 / 16, 2.0 / 16,
          1.0 / 16, 2.0 / 16, 1.0 / 16  
      );
      vec3 sampleTex[9];
      for(int i = 0; i < 9; i++){
          sampleTex[i] = vec3(texture(screenTexture, TexCoords.st + offsets[i]));// TexCoords.st = TexCoords.xy
      }
      vec3 col = vec3(0.0);
      for(int i = 0; i < 9; i++){
          col += sampleTex[i] * kernel[i];// 周围颜色乘以相应的权重并加起来就是核效果
      }
      FragColor = vec4(col, 1.0);
  }
  // 后期：边缘检测可能会导致锯齿，可以再进行模糊的核滤镜可减少锯齿
  ```

  cpp

  ```cpp
  Shader shader("assest/shader/4高级OpenGL/6.11.1.抗锯齿-cube.vs", "assest/shader/4高级OpenGL/6.11.1.抗锯齿-cube.fs");
  Shader screenShader("assest/shader/4高级OpenGL/6.11.2.抗锯齿-采样帧缓冲的颜色附件.vs", "assest/shader/4高级OpenGL/6.11.2.抗锯齿-采样帧缓冲的颜色附件.fs");
  float vertices[] = {
      -0.5f, -0.5f, -0.5f,
     ......
  };
  // 渲染quad的顶点数据
  float quadVertices[] = {   
      // 位置       // 纹理坐标
      -1.0f,  1.0f,  0.0f, 1.0f,
      -1.0f, -1.0f,  0.0f, 0.0f,
      1.0f, -1.0f,  1.0f, 0.0f,
  
      -1.0f,  1.0f,  0.0f, 1.0f,
      1.0f, -1.0f,  1.0f, 0.0f,
      1.0f,  1.0f,  1.0f, 1.0f
  };
  // cube
  unsigned int cubeVBO, cubeVAO;
  glGenVertexArrays(1, &cubeVAO);
  glGenBuffers(1, &cubeVBO);
  glBindBuffer(GL_ARRAY_BUFFER, cubeVBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  glBindVertexArray(cubeVAO);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  // quad
  unsigned int quadVBO, quadVAO;
  glGenVertexArrays(1, &quadVAO);
  glGenBuffers(1, &quadVBO);
  glBindBuffer(GL_ARRAY_BUFFER, quadVBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices), quadVertices, GL_STATIC_DRAW);
  glBindVertexArray(quadVAO);
  glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
  glEnableVertexAttribArray(1);
  // 重点代码：自定义帧缓冲进行离屏渲染////////////////////////////////////////
  // 1.1创建帧缓冲
  unsigned int framebuffer;
  glGenFramebuffers(1, &framebuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
  // 1.2创建多重采样纹理缓冲
  unsigned int textureColorBufferMultiSampled;
  glGenTextures(1, &textureColorBufferMultiSampled);
  glBindTexture(GL_TEXTURE_2D_MULTISAMPLE, textureColorBufferMultiSampled);
  glTexImage2DMultisample(GL_TEXTURE_2D_MULTISAMPLE, 4, GL_RGB, SCR_WIDTH, SCR_HEIGHT, GL_TRUE);// 重点在这
  glBindTexture(GL_TEXTURE_2D_MULTISAMPLE, 0);
  // 1.3将此多重采样纹理缓冲附加到当前绑定的帧缓冲中
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D_MULTISAMPLE, textureColorBufferMultiSampled, 0);;
  
  // 2.1创建一个临时的自定义帧缓冲，以便能将多重采样的图像进行采样后期处理
  unsigned int intermediateFBO;
  glGenFramebuffers(1, &intermediateFBO);
  glBindFramebuffer(GL_FRAMEBUFFER, intermediateFBO);
  // 2.2创建一个纹理缓冲
  unsigned int screenTexture;
  glGenTextures(1, &screenTexture);
  glBindTexture(GL_TEXTURE_2D, screenTexture);
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, SCR_WIDTH, SCR_HEIGHT, 0, GL_RGB, GL_UNSIGNED_BYTE, NULL);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  // 2.3将此纹理缓冲附加到当前绑定的帧缓冲中
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, screenTexture, 0);
  // 2.4检查是否附加成功
  if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
      std::cout << "错误：帧缓冲不完整" << std::endl;
  }
  glBindFramebuffer(GL_FRAMEBUFFER, 0);// 解绑
  
  // 设置shader采样的纹理单元为0
  screenShader.use();
  screenShader.setInt("screenTexture", 0);
  // render loop
  while (!glfwWindowShouldClose(window))
  {
      ......
      // 只有真正渲染场景的shader需要变换矩阵，而screenshader只需要采样纹理输出颜色
      glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
      glm::mat4 view = camera.GetViewMatrix();
      shader.use();
      shader.setMat4("projection", projection);
      shader.setMat4("view", view);
      shader.setMat4("model", glm::mat4(1.0f));
  	// 重点代码//////////////////////////////////////////////////////////////////////////////
      // 1.渲染场景到自定义的帧缓冲中
      glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
      glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
      glEnable(GL_DEPTH_TEST);
  
      glBindVertexArray(cubeVAO);
      glDrawArrays(GL_TRIANGLES, 0, 36);
  
      // 2.将自定义帧缓冲多重采样纹理缓冲的图像复制给临时帧缓冲的普通纹理缓冲中
      glBindFramebuffer(GL_READ_FRAMEBUFFER, framebuffer);    // 源：带有多重采样纹理缓冲附件的帧缓冲
      glBindFramebuffer(GL_DRAW_FRAMEBUFFER, intermediateFBO);// 目标：带有普通纹理缓冲附件的帧缓冲
      glBlitFramebuffer(0, 0, SCR_WIDTH, SCR_HEIGHT, 0, 0, SCR_WIDTH, SCR_HEIGHT, GL_COLOR_BUFFER_BIT, GL_NEAREST);
  
      // 3.初始化，先绑定屏幕默认的帧缓冲，才能输出图像到屏幕上）
      glBindFramebuffer(GL_FRAMEBUFFER, 0);
      glClearColor(1.0f, 1.0f, 1.0f, 1.0f); // 为了线框渲染时能看见：线框是黑色的，窗口为白色的才看得见
      glClear(GL_COLOR_BUFFER_BIT);
      glDisable(GL_DEPTH_TEST); 			// 禁用深度测试，这样屏幕空间四边形不会因深度测试而被丢弃。
  
      // 4.绘制quad，将临时帧缓冲的颜色缓冲附件当做纹理给着色器采样
      screenShader.use();
      glBindVertexArray(quadVAO);
      glActiveTexture(GL_TEXTURE0);
      glBindTexture(GL_TEXTURE_2D, screenTexture);// 颜色缓冲附件作为0号纹理单元的纹理
      glDrawArrays(GL_TRIANGLES, 0, 6);
  	......
  }
  ```

- 采样纹理时不加模糊后期效果

  ![](图片/4.11抗锯齿/4.立方体的边缘-自定义帧缓冲多重采样纹理采样.png)

- 采样纹理时加了模糊后期

  ![](图片/4.11抗锯齿/5.立方体的边缘-自定义帧缓冲多重采样纹理采样-后期模糊.png)
