# 坐标系统

- 标准化设备坐标介绍
  - 每个顶点的**x**，**y**，**z**坐标都在**-1.0**到**1.0**之间
  - OpenGL希望在每次**顶点着色器运行后**，我们可见的所有顶点都为标准化设备坐标
  - 我们通常会自己设定一个坐标的范围，之后再在顶点着色器中将**这些坐标变换**为标准化设备坐标
  
  - 将标准化设备坐标传入**光栅器**(Rasterizer)，将它们变换为屏幕上的二维坐标或像素。
  
- 多个坐标系统

  - 为什么存在

    将**坐标**变换为**标准化设备坐标**，接着再转化为**屏幕坐标**的过程通常是分步进行的，所以物体的顶点在最终转化为屏幕坐标之前还会被变换到**多个**坐标系统

  - 多个坐标系统的优点优点

    在这些特定的坐标系统中，一些操作或运算更加方便和容易

## 概述

![](图片/1.8坐标系统/coordinate_systems.png)

1. **局部坐标**是对象相对于局部原点的坐标，也是物体起始的坐标
2. 局部坐标通过Model矩阵变换为**世界空间坐标**，这些坐标相对于世界的全局原点，它们会和其它物体一起相对于世界的原点进行摆放。
3. **观察空间坐标**，通过view矩阵将世界空间转换到观察空间，使得每个坐标都是从摄像机或者说观察者的角度进行观察的。
4. **裁剪坐标**，通过投影矩阵从观察空间到裁剪空间，裁剪坐标会被处理（透视除法）至-1.0到1.0的范围内，并判断哪些顶点将会出现在屏幕上。
5. **视口变换**将-1.0到1.0范围的裁剪坐标（标准化设备坐标）变换到由glViewport函数所定义的坐标范围内。

## 局部空间

- 简介

  局部空间是指物体所在的坐标空间

## 世界空间

- 简介

  是指顶点相对于（游戏）**世界**的坐标

- 如何从局部到世界坐标

  该变换是由**模型矩阵**(Model Matrix)实现的。

## 观察空间

- 简介

  **摄像机**的视角所观察到的空间，是由**观察矩阵**(Model Matrix)从世界到观察坐标。

- view(观察)矩阵

  由一系列的位移和旋转的组合来完成，平移/旋转场景从而使得特定的对象被变换到摄像机的前方。

  这些组合在一起的变换通常存储在一个观察矩阵(View Matrix)里
  

## 裁剪空间

- 简介
  - OpenGL自动执行
  - 范围内的保留，范围外的裁掉
  - 当裁剪后剩下的可见的片段就是**裁剪空间**

- 如何进入裁剪空间
  
  由**投影矩阵**将观察空间变换到裁剪空间
  
- 投影矩阵分为
  
  - 正交投影
  - 透视投影

- 透视除法

  - 什么时候执行

    一旦所有顶点被变换到裁剪空间，OpenGL自动会透视除法（在每一个顶点着色器运行的最后被自动执行）

  - 它如何做

    将位置向量的x，y，z分量分别**除以**向量的齐次w分量

  - 结果

    透视除法**执行后**才将裁剪坐标系变换到**标准化设备坐标系**

- 小结工作流程（自己捋的，很大概率有误）

  设置-1000到1000范围，投影矩阵会将在这个范围内的坐标从观察空间变换到裁剪空间，然后OpenGL自动执行透视除法，转换为标准化设备坐标的范围(-1.0, 1.0)。

  所有的坐标先转换为(-1, 1)之间，然后不在-1.0到1.0的范围，会被裁剪掉（OpenGL自动执行裁剪）。

- 在标准化设备坐标系之后

  执行第一张图所说的**视口变换**：

  最终的坐标(标准化设备坐标系)将会被映射到屏幕空间中（使用glViewport中的设定），并被变换成片段。

  即：**视口变换将标准化设备坐标系到屏幕坐标**

### 正交投影

- 图片

  ![](图片/1.8坐标系统/orthographic_frustum.png)

- glm创建

  ```cpp
  glm::ortho(0.0f, 800.0f, 0.0f, 600.0f, 0.1f, 100.0f);
  ```

  - 前两个参数指定了平截头体的左右坐标

  - 第三和第四参数指定了平截头体的底部和顶部

    通过这四个参数我们定义了近平面和远平面的**大小**

  - 第五和第六个参数则定义了近平面和远平面的**距离**

- 缺点

  这个投影没有将**透视**(Perspective)考虑进去，所有的物体仿佛都保持原有大小。
  
  因为这个投影不改变每个向量的w分量，都保持1，透视除法是用x,y,z除以w分量，w=1，自然不会变。

### 透视投影

- 图片

  ![](图片/1.8坐标系统/perspective_frustum.png)

- 简介

  近大远小

- 透视投影矩阵如何工作

  - 这个投影矩阵将给定的平截头体范围映射到裁剪空间

  - 除此之外还**修改**了每个顶点坐标的**w**值

    - 从而使得离观察者**越远**的顶点坐标w分量越大。

    - 透视除法所做

      ![](图片/1.8坐标系统/Snipaste_2023-02-28_09-43-00.png)

      将位置向量的x，y，z分量分别**除以**向量的齐次w分量，因为远的顶点坐标w分量大，所以距离观察者**越远**顶点坐标就会**越小**

  - 什么时候执行透视除法
    - 上面有讲：由projection投影矩阵变换到裁剪空间后
    - OpenGL要求所有可见的坐标都落在-1.0到1.0范围内，作为顶点着色器最后的输出。因此，一旦坐标**在裁剪空间内之后**，就会**在裁剪空间坐标上**执行透视除法，透视除法执行后便是标准化设备坐标（-1.0,1.0）范围。

- glm创建

  ```cpp
  glm::mat4 proj = glm::perspective(glm::radians(45.0f), (float)width/(float)height, 0.1f, 100.0f);
  ```

  - 第一个参数定义了fov的值，它表示的是视野

  - 第二个参数设置了宽高比，由视口的宽除以高所得

  - 第三和第四个参数设置了平截头体的**近**和**远**平面

    - 说明第三个参数

      当 *near* 值设置太大时（如10.0f），OpenGL会将靠近摄像机的坐标**（在0.0f和10.0f之间）**都裁剪掉

- 透视投影与正交投影对比

  ![](图片/1.8坐标系统/perspective_orthographic.png)

## 把他们组合到一起

![](图片/1.8坐标系统/公式.png)

- 注意顺序

  - 写代码顺序

    v = projection * view * model * local

  - 读顺序

    需从右往左阅读矩阵

- 再重复了一次裁剪空间这点的内容

  >OpenGL将会自动进行透视除法和裁剪操作
  >
  >重要的顺序
  >
  >- 顶点着色器的输出要求所有的顶点都在**裁剪空间**内，这正是我们刚才使用变换矩阵所做的。
  >- OpenGL然后对**裁剪坐标**自动执行**透视除法**从而将它们变换到**标准化设备坐标**
  >- **视口变换**：OpenGL会使用glViewPort内部的参数来将标准化设备坐标映射到**屏幕坐标**

# 进入3D

- 观察矩阵
  - 将摄像机向后移动，和将**整个场景向前移动**是一样的。
  - 这正是观察矩阵所做的，我们以相反于摄像机移动的方向移动整个场景
  - 因为我们想要往后移动，所以场景需要沿着z轴负方向平移来实现，它会给我们一种我们在往后移动的感觉。（opengl右手坐标系）

## 例子1

- 代码

  glsl

  顶点着色器

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 1) in vec2 aTexCoord;
  out vec2 TexCoord;
  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;
  void main()
  {
      // 注意乘法要从右向左读
      gl_Position = projection * view * model * vec4(aPos, 1.0);
      TexCoord = aTexCoord;
  }
  ```

  - 在顶点着色器上进行坐标系转换，从局部空间到裁剪空间

    - 代码顺序是

      project\*view\*model\*local

    - 解读顺序是

      相反的需从右往左读：将顶点local经过model矩阵到世界空间，再经过view矩阵到观察空间，再经过project到裁剪空间。

  - 再次重复

    到裁剪空间后，经过**透视除法**到标准化设备坐标系，再经过**视口变换**到屏幕坐标，这两个是opengl自动执行的

  片段着色器

  ```cpp
  #version 330 core
  out vec4 FragColor;
  in vec2 TexCoord;
  uniform sampler2D texture1;
  uniform sampler2D texture2;
  void main()
  {
      FragColor = mix(texture(texture1, TexCoord), texture(texture2, TexCoord), 0.2);
  }
  ```

  cpp

  ```cpp
  Shader ourShader("assest/shader/1入门/1.8.transform.vs", "assest/shader/1入门/1.8.transform.fs");
  
  // 顶点数据
  float vertices[] = {
      // positions          // texture coords
      0.5f,  0.5f, 0.0f,   1.0f, 1.0f, // top right
      0.5f, -0.5f, 0.0f,   1.0f, 0.0f, // bottom right
      -0.5f, -0.5f, 0.0f,   0.0f, 0.0f, // bottom left
      -0.5f,  0.5f, 0.0f,   0.0f, 1.0f  // top left 
  };
  unsigned int indices[] = {
      0, 1, 3, // first triangle
      1, 2, 3  // second triangle
  };
  // 顶点数组
  unsigned int VBO, VAO, EBO;
  glGenVertexArrays(1, &VAO);
  glGenBuffers(1, &VBO);
  glGenBuffers(1, &EBO);
  glBindVertexArray(VAO);
  glBindBuffer(GL_ARRAY_BUFFER, VBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
  glBufferData(GL_ELEMENT_ARRAY_BUFFER, sizeof(indices), indices, GL_STATIC_DRAW);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(3 * sizeof(float)));
  glEnableVertexAttribArray(1);
  
  // 加载纹理
  unsigned int texture1, texture2;
  // texture 1
  glGenTextures(1, &texture1);
  glBindTexture(GL_TEXTURE_2D, texture1);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  int width, height, nrChannels;
  stbi_set_flip_vertically_on_load(true); // tell stb_image.h to flip loaded texture's on the y-axis.
  unsigned char* data = stbi_load(FileSystem::getPath("assest/textures/container.jpg").c_str(), &width, &height, &nrChannels, 0);
  if (data)
  {
      glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
      glGenerateMipmap(GL_TEXTURE_2D);
  }
  else
  {
      std::cout << "Failed to load texture" << std::endl;
  }
  stbi_image_free(data);
  // texture 2 和texture1一样
  .......
  // 告诉OpenGL两个采样器对应哪个纹理单元
  ourShader.use();
  ourShader.setInt("texture1", 0);
  ourShader.setInt("texture2", 1);
  
  // render loop
  while (!glfwWindowShouldClose(window))
  {
      // input
      processInput(window);
  
      // render
      glClearColor(0.2f, 0.3f, 0.3f, 1.0f);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT); // also clear the depth buffer now!
  
      // bind textures on corresponding texture units
      glActiveTexture(GL_TEXTURE0);
      glBindTexture(GL_TEXTURE_2D, texture1);
      glActiveTexture(GL_TEXTURE1);
      glBindTexture(GL_TEXTURE_2D, texture2);
  	// 此节重点在这///////////////////////////////////////////
      // 构造矩阵变换
      glm::mat4 model = glm::mat4(1.0f); // make sure to initialize matrix to identity matrix first
      glm::mat4 view = glm::mat4(1.0f);
      glm::mat4 projection = glm::mat4(1.0f);
      model = glm::rotate(model, glm::radians(-55.0f), glm::vec3(1.0f, 0.0f, 0.0f));
      // 注意，我们将矩阵向我们要进行移动场景的反方向移动。
      view = glm::translate(view, glm::vec3(0.0f, 0.0f, -3.0f));
      // 透视投影矩阵
      projection = glm::perspective(glm::radians(45.0f), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
  
      // 设置uniform
      ourShader.use();
      unsigned int modelLoc = glGetUniformLocation(ourShader.ID, "model");
      unsigned int viewLoc = glGetUniformLocation(ourShader.ID, "view");
      // 3种不同的方式发送数据给Shader
      glUniformMatrix4fv(modelLoc, 1, GL_FALSE, glm::value_ptr(model));
      glUniformMatrix4fv(viewLoc, 1, GL_FALSE, &view[0][0]);
      ourShader.setMat4("projection", projection);
  
      // 渲染box
      glBindVertexArray(VAO);
      glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_INT, 0);
  ```

  - 重点代码

    ```cpp
    // 将物体绕着x轴旋转-55.0度
    model = glm::rotate(model, glm::radians(-55.0f), glm::vec3(1.0f, 0.0f, 0.0f));
    // 注意，我们将矩阵向我们要进行移动场景的反方向移动。
    view = glm::translate(view, glm::vec3(0.0f, 0.0f, -3.0f));
    // 透视投影矩阵
    projection = glm::perspective(glm::radians(45.0f), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
    ```

- 效果

  ![](图片/1.8坐标系统/1.0效果-变换.png)

  - 经过model矩阵实现的旋转+透视投影可看到的效果
    - 稍微向后倾斜至地板方向。
    - 离我们有一些距离。
    - 有透视效果（顶点越远，变得越小）。

## 例子2：更加3D

- 代码改变

  与上一个例子相比的改变

  - 改变了顶点数据，顶点数据是一个箱子的36个顶点
  - 去除了索引缓冲与索引绘制
  - model矩阵不再是绕着x旋转-55度，而是绕着y轴旋转度数time（运行时间作为度数）

- 代码

  ```cpp
  float vertices[] = {
      -0.5f, -0.5f, -0.5f,  0.0f, 0.0f,
      0.5f, -0.5f, -0.5f,  1.0f, 0.0f,
      0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
      0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
      -0.5f,  0.5f, -0.5f,  0.0f, 1.0f,
      -0.5f, -0.5f, -0.5f,  0.0f, 0.0f,
  
      -0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
      0.5f, -0.5f,  0.5f,  1.0f, 0.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 1.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 1.0f,
      -0.5f,  0.5f,  0.5f,  0.0f, 1.0f,
      -0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
  
      -0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
      -0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
      -0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
      -0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
      -0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
      -0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
  
      0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
      0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
      0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
      0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
      0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
  
      -0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
      0.5f, -0.5f, -0.5f,  1.0f, 1.0f,
      0.5f, -0.5f,  0.5f,  1.0f, 0.0f,
      0.5f, -0.5f,  0.5f,  1.0f, 0.0f,
      -0.5f, -0.5f,  0.5f,  0.0f, 0.0f,
      -0.5f, -0.5f, -0.5f,  0.0f, 1.0f,
  
      -0.5f,  0.5f, -0.5f,  0.0f, 1.0f,
      0.5f,  0.5f, -0.5f,  1.0f, 1.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
      0.5f,  0.5f,  0.5f,  1.0f, 0.0f,
      -0.5f,  0.5f,  0.5f,  0.0f, 0.0f,
      -0.5f,  0.5f, -0.5f,  0.0f, 1.0f
  };
  model = glm::rotate(model, (float)glfwGetTime(), glm::vec3(0.0f, 1.0f, 0.0f));
  ```

- 效果

  ![](图片/1.8坐标系统/1.2效果-深度测试默认关闭.png)

  效果奇怪，奇怪的地方在于没有进行深度测试，导致后渲染的片段覆盖前渲染的片段，从而箱子的背面覆盖前面。

- 如何修复

  - 由于OpenGL默认不进行深度测试，需要设置开启深度测试，开启后opengl自动完成

    只需在渲染代码前中加一句

    ```cpp
    glEnable(GL_DEPTH_TEST);
    ```

  - 深度测试工作原理

    - OpenGL存储它的所有深度信息于一个Z缓冲，又称深度缓冲
    - GLFW会自动为你生成这样一个缓冲（就像它也有一个颜色缓冲来存储输出图像的颜色）
    - 深度值存储在每个片段里面（作为片段的**z**值），当片段想要输出它的颜色时，OpenGL会将它的深度值和**z缓冲**进行比较，如果当前的片段在其它片段**之后**，它将会被**丢弃**，**否则**将会覆盖

- 修复效果

  ![](图片/1.8坐标系统/1.1效果-深度测试开启.png)

## 例子3：箱子派对

- 实现思路

  - 定义10个箱子的出生点

  - 循环10次

    每次model为单位矩阵，再将model矩阵进行平移到出生点，再可以加上旋转效果（代码顺序）

- 代码

  ```cpp
  float vertices[] = {
      -0.5f, -0.5f, -0.5f,  0.0f, 0.0f,
  	......
  };
  // 出生点-初始位置
  glm::vec3 cubePositions[] = {
      glm::vec3(0.0f,  0.0f,  0.0f),
      glm::vec3(2.0f,  5.0f, -15.0f),
      glm::vec3(-1.5f, -2.2f, -2.5f),
      glm::vec3(-3.8f, -2.0f, -12.3f),
      glm::vec3(2.4f, -0.4f, -3.5f),
      glm::vec3(-1.7f,  3.0f, -7.5f),
      glm::vec3(1.3f, -2.0f, -2.5f),
      glm::vec3(1.5f,  2.0f, -2.5f),
      glm::vec3(1.5f,  0.2f, -1.5f),
      glm::vec3(-1.3f,  1.0f, -1.5f)
  };
  // render box
  glBindVertexArray(VAO);
  for (unsigned int i = 0; i < 10; i++)
  {
      glm::mat4 model = glm::mat4(1.0f);
      model = glm::translate(model, cubePositions[i]);    // 先平移
      float angle = 20.0f * i * (float)glfwGetTime();
      model = glm::rotate(model, glm::radians(angle), glm::vec3(1.0f, 0.3f, 0.5f));// 再旋转
      ourShader.setMat4("model", model);
  
      glDrawArrays(GL_TRIANGLES, 0, 36);
  }
  ```

  注意model矩阵，写代码的顺序是先平移再旋转，但是解读的话是先旋转再平移（请看本专栏中变换-矩阵的组合）。

- 效果

  ![](图片/1.8坐标系统/1.3效果-深度测试默认开启.png)




