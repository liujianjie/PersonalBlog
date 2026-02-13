# 我的理解

- 同深度测试一样有一个模板缓冲区，可以存储值，0-255值
- 想象喷油漆时使用的**图案模板**，先把模板贴在汽车上或者其他什么地方，然后开始喷油漆。在模板镂空的地方会有油漆喷到汽车上，而没有镂空的地方会挡住油漆。在喷完之后，揭下模板，图案就喷涂在汽车上了
- 先绘制了一个正方体，在转为屏幕坐标时，占据了一个二维矩阵大小的模板值且为**1**，想绘制第二个正方体，跟第一个正方体位置差不多，就判断第二个正方体所占二维矩阵像素片段对应的模板缓冲值为**0**才输出，则不会覆盖第一个正方体。

# 模板测试

## 模板介绍

- 简介

  - 当片段着色器处理完一个片段之后，模板测试(Stencil Test)会开始执行，和深度测试一样，它也可能会丢弃片段。

  - 模板测试是根据又一个缓冲来进行的，它叫做**模板缓冲**(Stencil Buffer)，GFLW自动创建

  - 一个模板缓冲中，（通常）每个模板值(Stencil Value)是**8**位的。所以每个像素/片段一共能有256种不同的模板值
  - 我们可以将这些模板值设置为我们想要的值，然后当某一个片段有某一个模板值的时候，我们就可以选择丢弃或是保留这个片段了

- 简单例子

  ![](图片/4.2模板测试/stencil_buffer.png)

  这个例子解释：

  模板缓冲首先会被清除为0，之后在模板缓冲中使用1填充了一个空心矩形。场景中的片段将会只在片段的模板值为1的时候会被渲染（其它的都被丢弃了）。

- 大体步骤

  - **启用**模板缓冲的写入。
  - 渲染物体，更新模板缓冲的内容。
  - **禁用**模板缓冲的写入。
  - 渲染（其它）物体，这次根据模板缓冲的内容**丢弃**特定的片段。

- 所以

  通过使用模板缓冲，我们可以根据场景中已绘制的其它物体的片段，来决定是否丢弃特定的片段。

- 代码

  - 启用模板测试

    ```cpp
    glEnable(GL_STENCIL_TEST);
    ```

  - 需要在每次迭代之前清除模板缓冲

    ```cpp
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT | GL_STENCIL_BUFFER_BIT);
    ```

  - 开启和禁止写入模板缓冲值

    ```cpp
    glStencilMask(0xFF); // 每一位写入模板缓冲时都保持原样
    glStencilMask(0x00); // 每一位在写入模板缓冲时都会变成0（禁用写入）
    ```

    glStencilMask(0x00)等同深度测试中的glDepthMask(GL_FALSE)=记住就行

## 模板函数

- 模板缓冲如何测试

  glStencilFunc(GLenum func, GLint ref, GLuint mask)一共包含三个参数：

  - `func`：设置模板测试函数(Stencil Test Function)。这个测试函数将会应用到已储存的模板值上和glStencilFunc函数的`ref`值上。可用的选项有：GL_NEVER、GL_LESS、GL_LEQUAL、GL_GREATER、GL_GEQUAL、GL_EQUAL、GL_NOTEQUAL和GL_ALWAYS。它们的语义和深度缓冲的函数类似。
  - `ref`：设置了模板测试的**参考值**(Reference Value)。模板缓冲的内容将会与这个值进行比较。
  - `mask`：设置一个掩码，它将会与**参考值**和**储存的模板值**在测试比较它们**之前**进行与(AND)运算。初始情况下所有位都为1。

  ```cpp
  glStencilFunc(GL_EQUAL, 1, 0xFF)
  ```

  这会告诉OpenGL，只要一个片段的模板值等于(`GL_EQUAL`)参考值**1**，片段将会通过测试并被绘制，否则会被丢弃。

- 它应该如何影响模板缓冲

  glStencilOp(GLenum sfail, GLenum dpfail, GLenum dppass);

  - `sfail`：模板测试失败时采取的行为。
  - `dpfail`：模板测试通过，但深度测试失败时采取的行为。
  - `dppass`：模板测试和深度测试都通过时采取的行为。

  | 行为         | 描述                                               |
  | :----------- | :------------------------------------------------- |
  | GL_KEEP      | 保持当前储存的模板值                               |
  | GL_ZERO      | 将模板值设置为0                                    |
  | GL_REPLACE   | 将模板值设置为glStencilFunc函数设置的`ref`值       |
  | GL_INCR      | 如果模板值小于最大值则将模板值加1                  |
  | GL_INCR_WRAP | 与GL_INCR一样，但如果模板值超过了最大值则归零      |
  | GL_DECR      | 如果模板值大于最小值则将模板值减1                  |
  | GL_DECR_WRAP | 与GL_DECR一样，但如果模板值小于0则将其设置为最大值 |
  | GL_INVERT    | 按位翻转当前的模板缓冲值                           |

  - 默认情况

    glStencilOp是设置为`(GL_KEEP, GL_KEEP, GL_KEEP)`的,不论任何测试的结果是如何，模板缓冲都会保留它的值。(即不更新模板值)

# 物体轮廓

## 介绍

- 实现图示

  ![](图片/4.2模板测试/stencil_object_outlining.png)

- 步骤

  1. 在绘制（需要添加轮廓的）物体之前，将模板函数设置为GL_ALWAYS，每当物体的片段被渲染时，将模板缓冲更新为1。
  2. 渲染物体。
  3. 禁用模板写入以及深度测试。
  4. 将每个物体**放大**一点点。
  5. 使用一个不同的片段着色器，输出一个单独的（边框）颜色。
  6. 再次绘制物体，但只在它们片段的模板值**不等于**1时才绘制。
  7. 回归原状：再次启用模板写入和深度测试。

## 代码

- glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  
  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;
  
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  void main(){ 
  	 FragColor = vec4(0.04, 0.28, 0.26, 1.0);
  }
  ```

- cpp

  ```cpp
  // configure global opengl state
  // -----------------------------
  glEnable(GL_DEPTH_TEST);
  glDepthFunc(GL_LESS); // always pass the depth test (same effect as glDisable(GL_DEPTH_TEST))
  // 要启用模板测试
  glEnable(GL_STENCIL_TEST);
  glStencilFunc(GL_NOTEQUAL, 1, 0xFF); // 这可以去除（下面重新设过了）。
  glStencilOp(GL_KEEP, GL_KEEP, GL_REPLACE);// 当模板值测试成功如何更新模板缓冲，模板测试和深度测试通过为1
  
   // build and compile shaders
  // -------------------------
  Shader shader("assest/shader/4高级OpenGL/2.1.模板测试.vs", "assest/shader/4高级OpenGL/2.1.模板测试.fs");
  Shader colorShader("assest/shader/4高级OpenGL/2.1.模板测试-colorshader.vs", "assest/shader/4高级OpenGL/2.1.模板测试-colorshader.fs");
  while (!glfwWindowShouldClose(window)){ 
      colorShader.use();
      colorShader.setMat4("view", view);
      colorShader.setMat4("projection", projection);
  
      shader.use();
      shader.setMat4("view", view);
      shader.setMat4("projection", projection);
  
      // 0.确保绘制地板的时候不会更新模板缓冲
      glStencilMask(0x00);
  
      // floor
      glBindVertexArray(planeVAO);
      glBindTexture(GL_TEXTURE_2D, floorTexture);
      model = glm::mat4(1.0f);
      shader.setMat4("model", model);
      glDrawArrays(GL_TRIANGLES, 0, 6);
      glBindVertexArray(0);
  
      // 1.在绘制（需要添加轮廓的）物体之前，将模板函数设置为GL_ALWAYS，每当物体的片段被渲染时，将模板缓冲更新为1。
      glStencilFunc(GL_ALWAYS, 1, 0xFF);
      glStencilMask(0xFF);
  
      // 2.渲染正常大小的物体
      // cubes
      float time = sin(glfwGetTime());
      glBindVertexArray(cubeVAO);
      glActiveTexture(GL_TEXTURE0);
      glBindTexture(GL_TEXTURE_2D, cubeTexture);
      model = glm::translate(model, glm::vec3(-1.0f, 0.0f, -1.0f));
      model = glm::rotate(model, time, glm::vec3(0, 0, 1));
      shader.setMat4("model", model);
      glDrawArrays(GL_TRIANGLES, 0, 36);
      model = glm::mat4(1.0f);
      model = glm::translate(model, glm::vec3(2.0f, 0.0f, 0.0f));
      model = glm::rotate(model, time, glm::vec3(0, 0, 1));
      shader.setMat4("model", model);
      glDrawArrays(GL_TRIANGLES, 0, 36);
  
      // 3.再次绘制物体，但只在它们片段的模板值不等于1时才绘制。
      glStencilFunc(GL_NOTEQUAL, 1, 0xFF); // 为了不覆盖正常大小的物体
      // 4.禁用模板写入以及深度测试。
      //glStencilMask(0x00);      // 这好像没用，禁用模板写入，绘制轮廓模板测试成功依旧成功，虽然没将轮廓所占的模板缓冲值设置为1，但是后面没有其它需要绘制的物体了
      glDisable(GL_DEPTH_TEST);// 为避免被地板覆盖轮廓，使后绘制的轮廓始终在前面
  
      // 5.将每个物体放大一点点。
      model = glm::mat4(1.0f);
      model = glm::translate(model, glm::vec3(-1.0f, 0.0f, -1.0f));
      model = glm::rotate(model, time, glm::vec3(0, 0, 1));
      model = glm::scale(model, glm::vec3(1.1f, 1.1f, 1.1f));
  
      // 6.使用一个不同的片段着色器，输出一个单独的（边框）颜色。
      colorShader.use();
      colorShader.setMat4("model", model);
      glDrawArrays(GL_TRIANGLES, 0, 36);
  
      // 同5和6
      model = glm::mat4(1.0f);
      model = glm::translate(model, glm::vec3(2.0f, 0.0f, 0.0f));
      model = glm::rotate(model, time, glm::vec3(0, 0, 1));
      model = glm::scale(model, glm::vec3(1.1f, 1.1f, 1.1f));
  
      colorShader.use();
      colorShader.setMat4("model", model);
      glDrawArrays(GL_TRIANGLES, 0, 36);
  
      // 7.再次启用模板写入和深度测试。
      glStencilMask(0xFF);    // 若改为禁用模板写入0x00，clear将不会清除模板的值，这样导致因为存留上一帧的模板残留值，会影响下一帧的图像输出
      glEnable(GL_DEPTH_TEST);
  
      // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
      // -------------------------------------------------------------------------------
      glfwSwapBuffers(window);
      glfwPollEvents();
  }
  ```
  
- 效果

  ![](图片/4.2模板测试/轮廓正方体例子.png)

- 我认为的过程-简单版

  - 先绘制正常大小的箱子，并将所占模板缓冲区矩阵填为1

    ```cpp
    000000000000000000000000000000000000
    000000000000000000000000000000000000
    000000000000000000000000000000000000
    000000000000000000000000000000000000
    000000000011111111111111000000000000
    000000000011111111111111000000000000
    000000000011111111111111000000000000
    000000000011111111111111000000000000
    000000000011111111111111000000000000
    000000000000000000000000000000000000
    000000000000000000000000000000000000
    000000000000000000000000000000000000
    ```

  - 再绘制**放大**一点点的箱子，与模板缓冲区的1值做对比，**不等于**1时才测试成功

    即：放大的箱子，不会覆盖原先正常大小的箱子片段输出的颜色，而是会占据原来大小箱子周围的片段。

    上面矩阵周围为0的片段

    ![](图片/4.2模板测试/模板缓冲矩阵 -画线.png)

# 加载模型的轮廓

- 先说问题

  由于模型的基准点在两脚之间（建模工具的原因），若放大顶点要绘制轮廓的大小，将会绘制错误

  ![](图片/4.2模板测试/9.1.1model轮廓不正常.png)

  正方体放大顶点能绘制正确是因为，正方体的基准点在中心

- 如何解决

  要绘制轮廓的顶点，将模型顶点朝着模型法线方向增长一点

- 代码

  glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 1) in vec3 aNormal;
  
  out vec3 Normal;
  
  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;
  
  void main()
  {
      Normal = mat3(transpose(inverse(model))) * aNormal;
      // 朝着法线方向增长
      gl_Position = projection * view * model * vec4(aPos, 1.0) + vec4(0.001 * Normal, 0);
  }
  
  ```

  cpp

  ```cpp
  // 2.渲染正常大小的物体
  // 渲染这个模型
  glm::mat4 model = glm::mat4(1.0f);
  model = glm::translate(model, glm::vec3(0.0f, 0.0f, 0.0f));
  model = glm::scale(model, glm::vec3(0.1f, 0.1f, 0.1f));
  ourShader.setMat4("model", model);
  ourModel.Draw(ourShader);
  
  // 3.再次绘制物体，但只在它们片段的模板值不等于1时才绘制。
  glStencilFunc(GL_NOTEQUAL, 1, 0xFF); // 为了不覆盖正常大小的物体
  // 4.禁用模板写入以及深度测试。
  glStencilMask(0x00);      // 这好像没用，若启用，绘制轮廓模板测试成功也只是将轮廓所占的模板缓冲值设置为1！
  glDisable(GL_DEPTH_TEST);// 为避免被地板覆盖轮廓，使后绘制的轮廓始终在前面
  
  // 5.将每个物体放大一点点。不用再这放大，在顶点着色器里放大
  model = glm::mat4(1.0f);
  model = glm::translate(model, glm::vec3(0.0f, 0.0f, 0.0f));
  model = glm::scale(model, glm::vec3(0.100f, 0.100f, 0.100f));
  ```

- 效果

  ![](图片/4.2模板测试/9.2model轮廓正常.png)
