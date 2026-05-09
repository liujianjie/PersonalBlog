# 颜色

- 物体颜色简介

  我们在现实生活中看到某一物体的颜色并不是这个物体真正拥有的颜色，而是它**所反射的(Reflected)颜色**。

  那些**不能**被物体所吸收(Absorb)的颜色（被拒绝的颜色）就是我们能够感知到的物体的颜色

- 举个栗子

  （太阳光能被看见的白光其实是由许多不同的颜色组合而成的（如下图所示））

  如果我们将白光照在一个蓝色的玩具上，这个蓝色的玩具会吸收白光中除了蓝色以外的所有子颜色，不被吸收的蓝色光被反射到我们的眼中，让这个玩具看起来是蓝色的

- 图示

  

  ![](图片/2.1颜色/light_reflection.png)

- 在opengl中

  在图中我们有一个白色的太阳，所以我们也将光源设置为**白色**。

  当我们把光源的颜色与物体的颜色值**相乘**，所得到的就是这个物体所反射的颜色（也就是我们所感知到的颜色）

- opengl例子

  ```cpp
  glm::vec3 lightColor(1.0f, 1.0f, 1.0f);
  glm::vec3 toyColor(1.0f, 0.5f, 0.31f);
  glm::vec3 result = lightColor * toyColor; // = (1.0f, 0.5f, 0.31f);
  ```

  我们可以看到玩具的颜色**吸收**了白色光源中很大一部分的颜色，但它根据自身的颜色值对红、绿、蓝三个分量都做出了一定的反射。这也表现了现实中颜色的工作原理。

  由此，我们可以定义物体的颜色为**物体从一个光源反射各个颜色分量的大小**
  
  ```cpp
  glm::vec3 lightColor(0.0f, 1.0f, 0.0f);
  glm::vec3 toyColor(1.0f, 0.5f, 0.31f);
  glm::vec3 result = lightColor * toyColor; // = (0.0f, 0.5f, 0.0f);
  ```
  
  可以看到，并没有红色和蓝色的光让我们的玩具来吸收或反射。这个玩具吸收了光线中一半的绿色值，但仍然也反射了一半的绿色值。玩具现在看上去是深绿色(Dark-greenish)的。我们可以看到，如果我们用绿色光源来照射玩具，那么只有绿色分量能被反射和感知到，红色和蓝色都不能被我们所感知到。这样做的结果是，一个珊瑚红的玩具突然变成了深绿色物体。

# OpenGL代码例子

- 代码

  glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  
  uniform mat4 view;
  uniform mat4 projection;
  uniform mat4 model;
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  uniform vec3 objectColor;
  uniform vec3 lightColor;
  
  void main()
  {
  	FragColor = vec4(lightColor * objectColor, 1.0f);
  }
  ```

  cpp

  ```cpp
  // 物体的光照shader
  Shader lightingShader("assest/shader/2光照/2.1.1.color.vs", "assest/shader/2光照/2.1.1.color.fs");
  // 光源shader
  Shader lightCubeShader("assest/shader/2光照/2.1.2.light_cube.vs", "assest/shader/2光照/2.1.2.light_cube.fs");
  
  // 0.1顶点数据
  float vertices[] = {
      -0.5f, -0.5f, -0.5f,
      ..........
  };
  unsigned int VBO, cubeVAO;
  glGenVertexArrays(1, &cubeVAO);
  glGenBuffers(1, &VBO);
  // 1. 绑定顶点数组对象
  glBindVertexArray(cubeVAO);
  // 2. 把我们的CPU的顶点数据复制到GPU顶点缓冲中，供OpenGL使用
  glBindBuffer(GL_ARRAY_BUFFER, VBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
  // 3. 设定顶点属性指针，来解释顶点缓冲中的顶点属性布局
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  
  // 重新创建一个顶点数组，同样指向这个顶点缓冲对象VBO
  unsigned int lightCubeVAO;
  glGenVertexArrays(1, &lightCubeVAO);
  glBindVertexArray(lightCubeVAO);
  // 重复利用顶点缓冲对象
  glBindBuffer(GL_ARRAY_BUFFER, VBO);// 绑定的是vbo
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  
  // render loop
  // -----------
  while (!glfwWindowShouldClose(window))
  {
      ......
      // render
      // ------
      glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  
      // 绑定着色器
      lightingShader.use();
      lightingShader.setVec3("objectColor", 1.0f, 0.5f, 0.31f);
      lightingShader.setVec3("lightColor", 1.0f, 1.0f, 1.0f);
  
      // 观察/投影变换
      glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
      glm::mat4 view = camera.GetViewMatrix();
      lightingShader.setMat4("projection", projection);
      lightingShader.setMat4("view", view);
  
      // 世界变换
      glm::mat4 model = glm::mat4(1.0f);
      lightingShader.setMat4("model", model);
  
      // 渲染这个cube
      glBindVertexArray(cubeVAO);
      glDrawArrays(GL_TRIANGLES, 0, 36);
  
      // 同样渲染白色的cube当做太阳
      lightCubeShader.use();
      lightCubeShader.setMat4("projection", projection);
      lightCubeShader.setMat4("view", view);
      model = glm::mat4(1.0f);
      model = glm::translate(model, lightPos);
      model = glm::scale(model, glm::vec3(0.2f)); // a smaller cube
      lightCubeShader.setMat4("model", model);
  
      glBindVertexArray(lightCubeVAO);
      glDrawArrays(GL_TRIANGLES, 0, 36);
  
      // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
      // -------------------------------------------------------------------------------
      glfwSwapBuffers(window);
      glfwPollEvents();
  }
  ```

- 效果

  ![](图片/2.1颜色/2.1颜色效果.png)


