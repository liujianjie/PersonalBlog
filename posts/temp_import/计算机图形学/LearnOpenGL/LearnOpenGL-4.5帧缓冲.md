# 简单理解

- GLFW有提供默认的帧缓冲
- 我们可以自定义帧缓冲代替默认的帧缓冲，这样渲染的图像可以渲染到我们自定义帧缓冲上附加的纹理缓冲中
- 对我们自定义的帧缓冲，由于能获得**附加**的纹理缓冲，且这个纹理缓冲被填满绘制的颜色值，那我们可以将当前渲染的图像看做图像**纹理**，在fragment着色器阶段进行不同的纹理读取方式实现后期效果

# 帧缓冲

- 简介

  用于写入颜色值的**颜色缓冲**、用于写入深度信息的**深度缓冲**和允许我们根据一些条件丢弃特定片段的**模板缓冲**。

  这些缓冲**结合**起来叫做帧缓冲。

  它被储存在**显存**中。

- 我们目前所做的所有操作都是在默认帧缓冲的渲染缓冲上进行的

  默认的帧缓冲是在创建窗口的时候生成和配置的（GLFW帮我们做了这些）。

- OpenGL允许我们定义我们自己的帧缓冲

  有了我们自己的帧缓冲，我们就能够有更多方式来**渲染**了

# 创建一个帧缓冲

- 代码

  ```cpp
  unsigned int fbo;
  glGenFramebuffers(1, &fbo);
  glBindFramebuffer(GL_FRAMEBUFFER, fbo);// 绑定帧缓冲
  ```

- 绑定帧缓冲函数

  - glBindFramebuffer

    - 在绑定到GL_FRAMEBUFFER目标之后，所有的**读取**和**写入**帧缓冲的操作将会影响当前绑定的帧缓冲。

    - 第一个参数可替换为

      - GL_READ_FRAMEBUFFER：使用在所有像是glReadPixels的读取操作
      - GL_DRAW_FRAMEBUFFER：会被用作渲染、清除等写入操作的目标

      GL_FRAMEBUFFER 包括这两个

- 绑定帧缓冲绑定之前

  还要满足以下条件才可以

  - 附加至少一个**缓冲**（颜色、深度或模板缓冲）。
  - 至少有一个颜色附件(Attachment)。
  - 所有的附件都必须是完整的（保留了内存）。
  - 每个缓冲都应该有相同的样本数。

- 完成以上条件，可以测试是否绑定成功

  ```cpp
  if(glCheckFramebufferStatus(GL_FRAMEBUFFER) == GL_FRAMEBUFFER_COMPLETE)
    // 绑定成功
  ```

- 离屏渲染

  渲染到一个不是默认帧缓冲被叫做**离屏渲染**(Off-screen Rendering)。

  渲染指令将不会对窗口的视觉输出有任何影响。即：不会渲染到屏幕上

- 再次激活默认帧缓冲

  ```cpp
  glBindFramebuffer(GL_FRAMEBUFFER, 0);
  ```

- 删除这个帧缓冲对象

  ```cpp
  glDeleteFramebuffers(1, &fbo);
  ```

# 纹理附件

纹理包含颜色、深度、模板缓冲纹理

- 简介 

  当把一个纹理附加到帧缓冲的时候，所有的渲染指令将会写入到这个纹理中，就像它是一个普通的颜色/深度或模板缓冲一样

- 优点

  所有渲染操作的结果将会被储存在一个**纹理图像**中，我们之后可以在着色器中很方便地使用它。

- 创建代码

  ```cpp
  unsigned int texture;
  glGenTextures(1, &texture);
  glBindTexture(GL_TEXTURE_2D, texture);
  
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, 800, 600, 0, GL_RGB, GL_UNSIGNED_BYTE, NULL);
  
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  ```

  - 主要的区别就是，我们将维度设置为了屏幕大小（尽管这不是必须的），并且我们给纹理的`data`参数传递了`NULL`。
  - 对于这个纹理，我们仅仅**分配**了内存而没有填充它。填充这个纹理将会在我们渲染到帧缓冲之后来进行。
  - 同样注意我们并不关心环绕方式或多级渐远纹理，我们在大多数情况下都不会需要它们。
  - 如果你想将你的屏幕渲染到一个**更小或更大**的纹理上，你需要（在渲染到你的帧缓冲之前）再次调用**glViewport**，使用纹理的新维度作为参数，否则只有一小部分的纹理或屏幕会被渲染到这个纹理上。
  
- 附加纹理到帧缓冲代码

  ```cpp
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texture, 0);
  ```

    glFrameBufferTexture2D有以下的参数：

    - `target`：帧缓冲的目标（绘制、读取或者两者皆有）
    - `attachment`：我们想要附加的附件类型。当前我们正在附加一个颜色附件。注意最后的`0`意味着我们可以附加**多个**颜色附件。
    - `textarget`：你希望附加的纹理类型
    - `texture`：要附加的纹理本身
    - `level`：多级渐远纹理的级别。我们将它保留为0。

- 附加**深度缓冲**纹理到帧缓冲代码

  GL_DEPTH_ATTACHMENT

  ```cpp
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_TEXTURE_2D, depthbuffer, 0);
  ```

  注意纹理的格式(Format)和内部格式(Internalformat)类型将变为GL_DEPTH_COMPONENT。

  应该是

  ```cpp
  glTexImage2D(GL_TEXTURE_2D, 0, GL_DEPTH_COMPONENT, 800, 600, 0, GL_DEPTH_COMPONENT, GL_UNSIGNED_BYTE, NULL);
  ```

- 附加**模板缓冲**纹理到帧缓冲代码

  GL_STENCIL_ATTACHMENT

  ```cpp
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_STENCIL_ATTACHMENT, GL_TEXTURE_2D, depthbuffer, 0);
  ```

  并将纹理的格式设定为GL_STENCIL_INDEX。

  ```cpp
  glTexImage2D(GL_TEXTURE_2D, 0, GL_STENCIL_INDEX, 800, 600, 0, GL_STENCIL_INDEX, GL_UNSIGNED_BYTE, NULL);
  ```

- 将深度缓冲和模板缓冲附加为**一个**单独的纹理

  纹理的每32位数值将包含**24**位的深度信息和**8**位的模板信息。

  纹理的格式

  ```cpp
  glTexImage2D(
    GL_TEXTURE_2D, 0, GL_DEPTH24_STENCIL8, 800, 600, 0, 
    GL_DEPTH_STENCIL, GL_UNSIGNED_INT_24_8, NULL
  );
  ```
  
  附加的附件类型
  
  ```cpp
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_TEXTURE_2D, texture, 0);
  ```

# 渲染缓冲对象附件

- 简介
  - 渲染缓冲对象(Renderbuffer Object)是在纹理之后引入到OpenGL中，作为一个可用的帧缓冲附件类型的，所以在过去**纹理是唯一可用的附件**。
  - 和纹理图像一样，渲染缓冲对象是一个真正的缓冲，即一系列的字节、整数、像素等。
  - 渲染缓冲对象附加的**好处**是，它会将数据储存为OpenGL原生的渲染格式，它是为离屏渲染到帧缓冲优化过的。
- 详细
  - 渲染缓冲对象直接将所有的渲染数据储存到它的缓冲中，不会做任何针对纹理格式的转换，让它变为一个更快的可写储存介质。
  - 渲染缓冲对象通常都是**只写**的，所以你**不能读取**它们（比如使用纹理访问）。
  - 当然你仍然还是能够使用**glReadPixels**来读取它，这会从当前绑定的**帧缓冲**，而不是附件本身，中返回特定区域的像素。

- 优点

  - 它的数据已经是原生的格式了，当**写入或者复制**它的数据到其它缓冲中时是非常快的。

  - **交换缓冲**这样的操作在使用渲染缓冲对象时会非常快。

    glfwSwapBuffers

- 创建代码

  ```cpp
  unsigned int rbo;
  glGenRenderbuffers(1, &rbo);
  ```

- 绑定这个渲染缓冲对象代码

  ```cpp
  glBindRenderbuffer(GL_RENDERBUFFER, rbo);
  ```

  - 由于渲染缓冲对象通常都是**只写**的，它们**会经常用于深度和模板附件**，因为大部分时间我们都不需要从深度和模板缓冲中读取值，只关心深度和模板测试。
  - 我们**需要**深度和模板值用于测试，但不需要对它们进行**采样**，所以渲染缓冲对象非常适合它们。
  - 当我们不需要从这些缓冲中采样的时候，通常都会选择渲染缓冲对象，因为它会更优化一点。

- 创建一个深度和模板渲染缓冲对象

  ```cpp
  glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8, 800, 600);
  ```

- 附加这个渲染缓冲对象

  ```cpp
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, rbo);
  ```

- 什么时候附加纹理和渲染缓冲对象

  - 渲染缓冲对象

    不需要从一个缓冲中采样数据

  - 纹理

    需要从缓冲中采样颜色或深度值等数据

# 例子1-渲染到帧缓冲的颜色纹理

- 需求

  - 将场景渲染到一个附加到帧缓冲对象上的颜色纹理中
  - 再将整个屏幕上绘制这个纹理

- 步骤

  1. 将新的帧缓冲绑定为激活的帧缓冲，和往常一样渲染场景
  2. 绑定默认的帧缓冲
  3. 绘制一个横跨整个屏幕的四边形，将帧缓冲的颜色缓冲作为它的**纹理**。

- 代码步骤

  ```cpp
  // 第一处理阶段(Pass)
  glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
  glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT); // 我们现在不使用模板缓冲
  glEnable(GL_DEPTH_TEST);
  DrawScene();    
  
  // 第二处理阶段
  glBindFramebuffer(GL_FRAMEBUFFER, 0); // 返回默认
  glClearColor(1.0f, 1.0f, 1.0f, 1.0f); 
  glClear(GL_COLOR_BUFFER_BIT);
  
  screenShader.use();  
  glBindVertexArray(quadVAO);
  glDisable(GL_DEPTH_TEST);
  glBindTexture(GL_TEXTURE_2D, textureColorbuffer);// 帧缓冲的颜色缓冲纹理作为着色器采样的纹理单元
  glDrawArrays(GL_TRIANGLES, 0, 6); 
  ```

- 代码

  整个屏幕上绘制这个纹理的glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 1) in vec2 aTexCoords;
  
  out vec2 TexCoords;
  
  void main()
  {
      gl_Position = vec4(aPos.x, aPos.y, 0.0, 1.0);
      TexCoords = aTexCoords;
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec2 TexCoords;// 纹理坐标
  
  uniform sampler2D screenTexture;
  
  void main(){ 
  
      vec4 diffuse = texture(screenTexture, TexCoords);
  	FragColor = diffuse;
  }
  ```

  cpp

  ```cpp
  ......
  // build and compile shaders
  // -------------------------
  Shader shader("assest/shader/4高级OpenGL/5.1.0.帧缓冲-渲染到纹理.vs", "assest/shader/4高级OpenGL/5.1.0.帧缓冲-渲染到纹理.fs");
  Shader shaderQuad("assest/shader/4高级OpenGL/5.1.1.帧缓冲-读取纹理到四边形.vs", "assest/shader/4高级OpenGL/5.1.1.帧缓冲-读取纹理到四边形.fs");
  
  ......
  float quadVertices[] = { // vertex attributes for a quad that fills the entire screen in Normalized Device Coordinates.
      // positions   // texCoords
      -1.0f,  1.0f,  0.0f, 1.0f,
      -1.0f, -1.0f,  0.0f, 0.0f,
      1.0f, -1.0f,  1.0f, 0.0f,
  
      -1.0f,  1.0f,  0.0f, 1.0f,
      1.0f, -1.0f,  1.0f, 0.0f,
      1.0f,  1.0f,  1.0f, 1.0f
  };
  ......
  // quad VAO
  unsigned int quadVAO, quadVBO;
  glGenVertexArrays(1, &quadVAO);
  glGenBuffers(1, &quadVBO);
  glBindVertexArray(quadVAO);
  glBindBuffer(GL_ARRAY_BUFFER, quadVBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices), &quadVertices, GL_STATIC_DRAW);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(1);
  glVertexAttribPointer(1, 2, GL_FLOAT, GL_FALSE, 4 * sizeof(float), (void*)(2 * sizeof(float)));
  glBindVertexArray(0);
  // load textures
  // -------------
  unsigned int cubeTexture = loadTexture(FileSystem::getPath("assest/textures/container2.png").c_str());
  unsigned int floorTexture = loadTexture(FileSystem::getPath("assest/textures/wall.jpg").c_str());
  
  // shader configuration
  // --------------------
  shader.use();
  shader.setInt("texture1", 0);
  
  shaderQuad.use();
  shaderQuad.setInt("screenTexture", 0);
  
  // 帧缓冲配置
  unsigned int framebuffer;
  glGenFramebuffers(1, &framebuffer);
  glBindFramebuffer(GL_FRAMEBUFFER, framebuffer); // 绑定自定义的帧缓冲，代替默认的帧缓冲
  
  // 生成纹理颜色缓冲
  unsigned int texColorBuffer;
  glGenTextures(1, &texColorBuffer);
  glBindTexture(GL_TEXTURE_2D, texColorBuffer);
  glTexImage2D(GL_TEXTURE_2D, 0, GL_RGB, SCR_WIDTH, SCR_HEIGHT, 0, GL_RGB, GL_UNSIGNED_BYTE, NULL);
  
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
  glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
  glBindTexture(GL_TEXTURE_2D, 0);
  
  // 将它（纹理）附加到当前绑定的帧缓冲对象
  glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, texColorBuffer, 0);
  
  // 创建一个渲染缓冲对象以便能进行深度（模板）测试
  unsigned int rbo;
  glGenRenderbuffers(1, &rbo);
  glBindRenderbuffer(GL_RENDERBUFFER, rbo);
  glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH24_STENCIL8, SCR_WIDTH, SCR_HEIGHT);
  glBindRenderbuffer(GL_RENDERBUFFER, 0);
  
  // 将渲染缓冲对象 附加 到 帧缓冲的深度和模板附件 上
  glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_STENCIL_ATTACHMENT, GL_RENDERBUFFER, rbo);// 若没有附加渲染缓冲对象，深度测试会失败，图像渲染错误
  
  if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE) {
      std::cout << "ERROR::FRAMEBUFFER:: Framebuffer is not complete!" << std::endl;
  }
  glBindFramebuffer(GL_FRAMEBUFFER, 0); // 绑定回默认的帧缓冲
  
  // render loop
  // -----------
  while (!glfwWindowShouldClose(window))
  {
      ......
      // render
      // ------
      // 第一步：渲染到自定义帧缓冲的纹理附件中
      glBindFramebuffer(GL_FRAMEBUFFER, framebuffer);
      glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
      glEnable(GL_DEPTH_TEST);
  
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
  
      // 渲染模式切换
      glPolygonMode(GL_FRONT_AND_BACK, GL_LINE); // 切换到线框模式
      glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);// 设置回默认模式
  
      // 第二步：渲染到默认帧缓冲中
      glBindFramebuffer(GL_FRAMEBUFFER, 0); 
      glClearColor(1.0f, 1.0f, 1.0f, 1.0f); // 线框是黑色的，窗口为白色的才看得见
      glClear(GL_COLOR_BUFFER_BIT); 
      glDisable(GL_DEPTH_TEST); // 禁用深度测试，这样屏幕空间四边形不会因深度测试而被丢弃。
  
      // quad
      shaderQuad.use();
      glBindVertexArray(quadVAO);
      glBindTexture(GL_TEXTURE_2D, texColorBuffer);// 帧缓冲的颜色缓冲纹理作为着色器采样的纹理单元
      glDrawArrays(GL_TRIANGLES, 0, 6);
      glBindVertexArray(0);
  
      ......
  ```

- 效果

  虽然和前面一样，但其实渲染到帧缓冲的颜色纹理缓冲上，将此演示纹理缓冲作为着色器采样的纹理单元，glsl采样后输出纹理图像，与前面的效果一样

  ![](图片/4.5帧缓冲/1.2渲染到纹理上的效果.png)

  但是若用线框模式绘制，可得下面结果，可得上图其实是在一个quad四边形上贴上**纹理图像**。

  ```cpp
  // 渲染模式切换
  glPolygonMode(GL_FRONT_AND_BACK, GL_LINE); // 切换到线框模式
  glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);// 设置回默认模式
  ```
  
  ![](图片/4.5帧缓冲/1.3线框效果.png)
  
  

# 后期处理

既然整个场景都被渲染到了一个**纹理**上，我们可以简单地通过修改纹理数据创建出一些非常有意思的效果。

## 例子1：反相

我们将会从屏幕纹理中取颜色值，然后用1.0减去它，对它进行反相

```cpp
void main()
{
    FragColor = vec4(vec3(1.0 - texture(screenTexture, TexCoords)), 1.0);
}
```

![](图片/4.5帧缓冲/2.1渲染到纹理后期-反向.png)

## 例子2：灰度

取所有的颜色分量，将它们平均化

```cpp
void main()
{
    FragColor = texture(screenTexture, TexCoords);
    float average = (FragColor.r + FragColor.g + FragColor.b) / 3.0;
    FragColor = vec4(average, average, average, 1.0);
}
```

![](图片/4.5帧缓冲/2.2.1渲染到纹理后期-灰度.png)

但人眼会对绿色更加敏感一些，而对蓝色不那么敏感，所以为了获取物理上更精确的效果，我们需要使用加权的(Weighted)通道：

```cpp
void main()
{
    FragColor = texture(screenTexture, TexCoords);
    // // 人眼对绿色更加敏感
    float average = 0.2126 * FragColor.r + 0.7152 * FragColor.g + 0.0722 * FragColor.b;
    FragColor = vec4(average, average, average, 1.0);
}
```

![](图片/4.5帧缓冲/2.2.2渲染到纹理后期-灰度.png)

好像没什么差别。。。

## 核效果

- 引入

  在一个纹理图像上做后期处理的另外一个好处是，我们可以从纹理的其它地方采样颜色值。比如说我们可以在当前纹理坐标的周围取一小块区域，对当前纹理值**周围的多个纹理值**进行采样

- 核

  核(Kernel)（或卷积矩阵(Convolution Matrix)）是一个类**矩阵**的数值数组，它的中心为当前的像素，它会用它的核值乘以周围的像素值，并将结果**相加**变成一个值。

  所以，基本上我们是在对当前像素周围的纹理坐标添加一个小的偏移量，并根据核将结果合并。

- 例子

  ![](图片/4.5帧缓冲/kernel矩阵.png)

  称为**锐化核**

  - 这个核取了8个周围像素值，将它们乘以2，而把当前的像素乘以-15。这个核的例子将周围的像素乘上了一个权重，并将当前像素乘以一个比较大的负权重来平衡结果。
  - 你在网上找到的大部分核将所有的权重加起来之后都应该会**等于1**，如果它们加起来不等于1，这就意味着最终的纹理颜色将会比原纹理值更亮或者更暗了。

- 代码

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec2 TexCoords;// 纹理坐标
  
  uniform sampler2D screenTexture;
  
  const float offset = 1.0 / 300.0;
  
  void main(){ 
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
      float kernel[9] = float[](
          -1, -1, -1,
          -1,  9, -1,
          -1, -1, -1
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
  ```

  ![](图片/4.5帧缓冲/2.3渲染到纹理后期-核效果.png)

  麻醉剂所感受到的效果

## 模糊

创建模糊(Blur)效果的核是这样的：

![](图片/4.5帧缓冲/模糊效果kernel矩阵.png)

由于所有值的**和是16**，所以直接返回合并的采样颜色将产生非常亮的颜色，所以我们需要将核的每个值都除以16。最终的核数组将会是：

```cpp
float kernel[9] = float[](
    1.0 / 16, 2.0 / 16, 1.0 / 16,
    2.0 / 16, 4.0 / 16, 2.0 / 16,
    1.0 / 16, 2.0 / 16, 1.0 / 16  
);
```

![](图片/4.5帧缓冲/2.4渲染到纹理后期-模糊效果.png)

没带眼镜的时候

## 边缘检测

边缘检测(Edge-detection)核和锐化核非常相似：

![](图片/4.5帧缓冲/边缘检测效果kernel矩阵.png)

这个核高亮了所有的**边缘**，而暗化了其它部分

![](图片/4.5帧缓冲/2.5渲染到纹理后期-边缘检测效果.png)

## **译注**

- 核在对屏幕纹理的边缘进行采样的时候，由于还会对中心像素周围的8个像素进行采样，其实会取到纹理之外的像素
- 由于环绕方式默认是**GL_REPEAT**，所以在没有设置的情况下取到的是屏幕另一边的像素，而另一边的像素本不应该对中心像素产生影响，这就可能会在屏幕边缘产生很奇怪的条纹。
- 为了消除这一问题，我们可以将屏幕纹理的环绕方式都设置为**GL_CLAMP_TO_EDGE**。
- 这样子在取到纹理外的像素时，就能够重复边缘的像素来更精确地估计最终的值了。

但我测试(核效果)，改为GL_CLAMP_TO_EDGE地板显示更不对，地板的uv是0-2范围，会造成重复采样边缘像素以填满剩下的一半，所以若用GL_CLAMP_TO_EDGE应该地板的uv改为0-1范围

![](图片/4.5帧缓冲/GL_CLAMP_TO_EDGE错误效果.png)

如果没有出现奇怪的效果，就不要这样做吧

