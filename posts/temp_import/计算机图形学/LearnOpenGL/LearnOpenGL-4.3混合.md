# 混合

## 有点长的介绍

- OpenGL中，**混合**(Blending)通常是实现物体**透明度**(Transparency)的一种技术

- 透明就是说一个物体（或者其中的一部分）不是纯色(Solid Color)的，它的颜色是物体本身的颜色和它背后其它物体的颜色的不同强度**结合**。

- 一个有色玻璃窗是一个透明的物体，玻璃有它自己的颜色，但它最终的颜色还包含了玻璃之后所有物体的颜色。

- 这也是混合这一名字的出处，我们**混合**(Blend)（不同物体的）**多**种颜色为**一**种颜色。所以透明度能让我们看穿物体。

- 图示

  ![](图片/4.3混合/blending_transparency.png)

  - 透明的物体可以是完全透明的（让所有的颜色穿过），或者是半透明的（它让颜色通过，同时也会显示自身的颜色）。
  - 一个物体的透明度是通过它颜色的**alpha**值来决定的
  - 当alpha值为0.5时，物体的颜色有50%是来自物体自身的颜色，50%来自背后物体的颜色。

# 丢弃片段

- 有些图片并不需要半透明，只需要根据纹理颜色值，显示一部分，或者不显示一部分，没有中间情况。

- 例子

  草的形状和2D四边形的形状并不完全相同，所以你只想显示草纹理的某些部分，而忽略剩下的部分。

- 例如图

  ![](图片/4.3混合/grass.png)

  ![](图片/4.3混合/0.草的alpha值.png)

  我们想要丢弃(Discard)显示纹理中透明部分的片段，不将这些片段存储到颜色缓冲中。

- 与alpha相关的代码

  加载rgba图像

  ```cpp
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA, width, height, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
  ```

  读取rgba图像

  ```
  void main()
  {
      // FragColor = vec4(vec3(texture(texture1, TexCoords)), 1.0);
      FragColor = texture(texture1, TexCoords);
  }
  ```

- 原样输出

  ![](图片/4.3混合/1.1混合草错误的结果.png)

  由于这是rgba图像，而glsl直接读取了rbga元素后，OpenGL默认是不知道怎么处理alpha值的，更不知道什么时候应该丢弃片段，所以图像模糊

- 丢弃alpha低的像素

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec2 TexCoords;
  
  uniform sampler2D texture1;
  
  void main()
  {             
      vec4 texColor = texture(texture1, TexCoords);
      if(texColor.a < 0.1)
          discard;
      FragColor = texColor;
  }
  ```

- 正确结果

  ![](图片/4.3混合/1.2混合草边框不正确.png)

  但能看到有白色边框，当采样纹理的边缘的时候，OpenGL会对边缘的值和纹理下一个重复的值进行插值（因为我们将它的环绕方式设置为了**GL_REPEAT**）。这通常是没问题的，但是由于我们使用了透明值，纹理图像的**顶部**将会与**底部边缘**的纯色值进行**插值**。这样的结果是一个半透明的有色边框，可能会看见它环绕着你的纹理四边形。要想避免这个，每当alpha纹理的时候，请将纹理的环绕方式设置为GL_CLAMP_TO_EDGE（在边缘采样颜色）：

  ```cpp
  glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
  glTexParameteri( GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
  ```

# 混合

- 引入

  虽然直接**丢弃**片段很好，但它不能让我们渲染半透明的图像。

  要想渲染有多个透明度级别的图像，我们需要启用混合

- 启用混合代码

  ```cpp
  glEnable(GL_BLEND);
  ```

- 解释如何混合

  ![](图片/4.3混合/颜色混合函数.png)

  片段着色器运行完成后，并且所有的测试都通过之后，这个**混合方程(**Blend Equation)才会应用到片段颜色输出与当前颜色缓冲中的值（当前片段之前储存的之前片段的颜色）上

- 图像+文字解释混合

  源颜色和目标颜色将会由OpenGL自动设定，但**源因子和目标因子的值可以由我们来决定**。

  ![](图片/4.3混合/blending_equation.png)

  我们有两个方形，我们希望将这个半透明的绿色方形绘制在红色方形之上。红色的方形将会是目标颜色（所以它应该先在颜色缓冲中），我们将要在这个红色方形**之上**绘制这个绿色方形。

  问题来了：我们将因子值设置为什么？我们至少想让绿色方形乘以它的alpha值，所以我们想要将FsrcFsrc设置为源颜色向量的alpha值，也就是0.6。接下来就应该清楚了，目标方形的贡献应该为剩下的alpha值。如果绿色方形对最终颜色贡献了60%，那么红色方块应该对最终颜色贡献了40%，即`1.0 - 0.6`。所以我们将**Fdestination**设置为1**减去**源颜色向量的alpha值。这个方程变成了：

  ![](图片/4.3混合/混合值计算.png)

  结果就是重叠方形的片段包含了一个60%绿色，40%红色的一种脏兮兮的颜色：

  ![](图片/4.3混合/blending_equation_mixed.png)

- 该如何让OpenGL使用这样的因子

  代码

  ```cpp
  glBlendFunc(GLenum sfactor, GLenum dfactor)
  ```

  函数接受两个参数，来设置**源**和**目标**因子

  | 选项                          | 值                                 |
  | :---------------------------- | :--------------------------------- |
  | `GL_ZERO`                     | 因子等于0                          |
  | `GL_ONE`                      | 因子等于1                          |
  | `GL_SRC_COLOR`                | 因子等于源颜色向量C¯source         |
  | `GL_ONE_MINUS_SRC_COLOR`      | 因子等于1−C¯source                 |
  | `GL_DST_COLOR`                | 因子等于目标颜色向量C¯destination  |
  | `GL_ONE_MINUS_DST_COLOR`      | 因子等于1−C¯destination            |
  | `GL_SRC_ALPHA`                | 因子等于C¯source的alpha分量        |
  | `GL_ONE_MINUS_SRC_ALPHA`      | 因子等于1− C¯source的alpha分量     |
  | `GL_DST_ALPHA`                | 因子等于C¯destination的alpha分量   |
  | `GL_ONE_MINUS_DST_ALPHA`      | 因子等于1− C¯destination的alph分量 |
  | `GL_CONSTANT_COLOR`           | 因子等于常数颜色向量C¯constant     |
  | `GL_ONE_MINUS_CONSTANT_COLOR` | 因子等于1−C¯constant               |
  | `GL_CONSTANT_ALPHA`           | 因子等于C¯constant的alpha分量      |
  | `GL_ONE_MINUS_CONSTANT_ALPHA` | 因子等于1−C¯constant的alpha分量    |

  ```cpp
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
  ```

- 额外特性

  当前源和目标是相加的，但如果愿意的话，我们也可以让它们相减

  glBlendEquation(GLenum mode)允许我们设置运算符，它提供了三个选项：

  ![](图片/4.3混合/如何混合.png)

# 渲染半透明纹理

## 例子：被深度缓冲测试影响的不正确混合

- glsl

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec2 TexCoords;// 纹理坐标
  
  uniform sampler2D texture1;
  
  void main(){ 
  
      vec4 diffuse = texture(texture1, TexCoords);
  	FragColor = diffuse;
  }
  ```

- cpp

  ```cpp
  glEnable(GL_BLEND);
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);
  ```
  
- 效果

  ![](图片/4.3混合/2.1混合错误-覆盖后面的.png)

- 为什么会造成这样的情况

  我的理解：

  先绘制前面的窗户，由于混合的作用与地板的颜色混合了，此刻输出了这个混合颜色，并且深度缓冲区记录了这个窗户的z深度值，当绘制后面的窗户时，会因为被深度缓冲测试影响（z值比深度缓冲区的z值大）所以被**丢弃**，即被前面的窗户所覆盖。

  原文：

  深度测试和混合一起使用的话会产生一些麻烦。当写入深度缓冲时，深度缓冲不会检查片段是否是透明的，所以透明的部分会和其它值一样写入到深度缓冲中。结果就是窗户的整个四边形不论透明度都会进行深度测试。即使透明的部分应该显示背后的窗户，深度测试仍然丢弃了它们。

- 如何解决

  先绘制后面的窗户，再绘制前面的窗户

## 绘制正确的窗户例子

- 原则

  1. 先绘制所有**不透明**的物体。
  2. 对所有透明的物体**排序**（按深度值从小往大）。
  3. 按顺序绘制所有透明的物体（从后往前）。

- 如何排序透明物体

  从观察者视角获取物体的距离。这可以通过计算摄像机位置向量和物体的位置向量之间的距离所获得。接下来我们把距离和它对应的位置向量存储到一个STL库的map数据结构中。map会自动根据键值(Key)对它的值排序，所以只要我们添加了所有的位置，并以它的距离作为键，它们就会自动根据距离值从小往大排序了。

- 代码

  需要每次在循环内部，根据输入后影响摄像机坐标后再排序

  cpp

  ```cpp
  .....
  
  // configure global opengl state
  // -----------------------------
  glEnable(GL_DEPTH_TEST);
  glDepthFunc(GL_LESS);
  // 开启混合和混合方式
  glEnable(GL_BLEND);
  glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);// 意思是，前面的alpha做源因子值，后面的1-前面的alpha做目标因子
  
  // build and compile shaders
  // -------------------------
  Shader shader("assest/shader/4高级OpenGL/3.1.混合-窗户.vs", "assest/shader/4高级OpenGL/3.1.混合-窗户.fs");
  
  .....
  // load textures
  // -------------
      unsigned int cubeTexture = loadTexture(FileSystem::getPath("assest/textures/container2.png").c_str());
  unsigned int floorTexture = loadTexture(FileSystem::getPath("assest/textures/wall.jpg").c_str());
  unsigned int windowTexture = loadTexture(FileSystem::getPath("assest/textures/window.png").c_str());
  
  vector<glm::vec3> vegetation
  {
      glm::vec3(-1.5f, 0.0f, -0.48f),
      glm::vec3(1.5f, 0.0f, 0.51f),
      glm::vec3(0.0f, 0.0f, 0.7f),
      glm::vec3(-0.3f, 0.0f, -2.3f),
      glm::vec3(0.5f, 0.0f, -0.6f)
  };
  
  // shader configuration
  // --------------------
  shader.use();
  shader.setInt("texture1", 0);
  
  // render loop
  // 为解决后绘制的窗户像素会被丢弃，不参与混合，而需要严格排序
  std::map<float, glm::vec3> sorted;
  while (!glfwWindowShouldClose(window))
  {
      // per-frame time logic
      // --------------------
      float currentFrame = static_cast<float>(glfwGetTime());
      deltaTime = currentFrame - lastFrame;
      lastFrame = currentFrame;
  
      // input
      // -----
      processInput(window);
  
      // 得在输入完改变摄像机位置后再排序
      for (unsigned int i = 0; i < windows.size(); i++) {
          float distance = glm::length(camera.Position - windows[i]);
          sorted[distance] = windows[i];
      }
  
      // render
      // ------
      glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  
      shader.use();
      glm::mat4 model = glm::mat4(1.0f);
      glm::mat4 view = camera.GetViewMatrix();
      glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
      shader.setMat4("view", view);
      shader.setMat4("projection", projection);
      // cubes
      glBindVertexArray(cubeVAO);
      glActiveTexture(GL_TEXTURE0);
      glBindTexture(GL_TEXTURE_2D, cubeTexture);
      model = glm::translate(model, glm::vec3(-1.0f, 0.0f, -1.0f));
      shader.setMat4("model", model);
      glDrawArrays(GL_TRIANGLES, 0, 36);
      model = glm::mat4(1.0f);
      model = glm::translate(model, glm::vec3(2.0f, 0.0f, 0.0f));
      shader.setMat4("model", model);
      glDrawArrays(GL_TRIANGLES, 0, 36);
      // floor
      glBindVertexArray(planeVAO);
      glBindTexture(GL_TEXTURE_2D, floorTexture);
      model = glm::mat4(1.0f);
      shader.setMat4("model", model);
      glDrawArrays(GL_TRIANGLES, 0, 6);
      glBindVertexArray(0);
  
      // 窗户
      glBindVertexArray(grassVAO);
      glBindTexture(GL_TEXTURE_2D, windowTexture);
      model = glm::mat4(1.0f);
      // 先画距离远的，再画距离近的
      for (std::map<float, glm::vec3>::reverse_iterator it = sorted.rbegin(); it != sorted.rend(); ++it) {
          model = glm::mat4(1.0f);
          model = glm::translate(model, it->second);
          shader.setMat4("model", model);
          glDrawArrays(GL_TRIANGLES, 0, 6);
      }
      glBindVertexArray(0);
  
      // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
      // -------------------------------------------------------------------------------
      glfwSwapBuffers(window);
      glfwPollEvents();
  }
  ```

- 效果

  ![](图片/4.3混合/2.2混合窗户-正确.png)
