# 实例化

- 引出

  - 假设有一个绘制了很多模型的场景，而大部分的模型包含的是**同一组顶点数据**，只不过进行的是不同的世界空间变换，比如：草

  - 渲染上千上万个草，渲染函数调用会极大地影响性能

    ```cpp
    for(unsigned int i = 0; i < amount_of_models_to_draw; i++)
    {
        DoSomePreparations(); // 绑定VAO，绑定纹理，设置uniform等
        glDrawArrays(GL_TRIANGLES, 0, amount_of_vertices);
    }
    ```

  - 性能消耗的地方

    OpenGL在绘制顶点数据之前需要做很多准备工作（比如告诉GPU该从哪个缓冲读取数据，从哪寻找顶点属性，而且这些都是在相对缓慢的CPU到GPU总线(CPU to GPU Bus)上进行的）。

    即便渲染顶点非常快，**命令GPU**去渲染却未必。

- 什么是实例化

  - 解决上述的性能消耗的地方

    我们能够将数据**一次性**发送给GPU，然后使用**一个绘制函数**让OpenGL利用这些数据绘制**多**个物体。这就是实例化

  - 进一步解释

    实例化这项技术能够让我们使用**一个渲染调用**来绘制**多个物体**，来节省每次绘制物体时CPU -> GPU的通信，它只需要**一次**即可。

  - 使用什么函数

    将glDrawArrays和glDrawElements的渲染调用分别**改为**glDrawArraysInstanced和glDrawElementsInstanced

  - GLSL有内建变量：**gl_InstanceID**

    渲染同一个物体一千次对我们并没有什么用处，每个物体都是完全相同的，而且还在同一个位置。

    利用gl_InstanceID可以标识每个实例，可以用此gl_InstanceID**对应**专属的uniform变换矩阵，从而变换当前渲染的物体（改变位置、大小等）。

## 例子1.1：100个2D四边形使用Uniform

- 思路

  - glsl的顶点着色器

    定义uniform数组，每个渲染的实例quad：根据gl_InstanceID当做uniform数组的**下标**得到当前渲染的实例的变换位置

  - cpp

    - 定义quad的顶点输入数据
    - 定义顶点缓冲数组、绑定顶点缓冲对象、指定好顶点属性布局
    - 生成偏移位置数组，并用uniform上传给glsl
    - 绘制时使用glDrawArraysInstanced，将同一个quad数据渲染100次

- 代码

  ```cpp
#version 330 core
  layout (location = 0) in vec2 aPos;
  layout (location = 1) in vec3 aColor;
  
  out vec3 fColor;
  
  uniform vec2 offsets[100];
  
  void main()
  {
  	// gl_InstanceID当前绘制实例的ID，作为offsets的下标
  	vec2 offset = offsets[gl_InstanceID];
  	gl_Position = vec4(aPos + offset, 0.0, 1.0);
  	fColor = aColor;
  }
  ```
  
  ```CPP
#version 330 core
  out vec4 FragColor;
  
  in vec3 fColor;
  
  void main(){ 
  	FragColor = vec4(fColor, 1.0);
  }
  ```
  
  cpp

  ```cpp
float quadVertices[] = {
      // 位置，二维          // 颜色
      -0.05f,  0.05f,  1.0f, 0.0f, 0.0f,
      0.05f, -0.05f,  0.0f, 1.0f, 0.0f,
      -0.05f, -0.05f,  0.0f, 0.0f, 1.0f,
  
      -0.05f,  0.05f,  1.0f, 0.0f, 0.0f,
      0.05f, -0.05f,  0.0f, 1.0f, 0.0f,
      0.05f,  0.05f,  0.0f, 1.0f, 1.0f
  };
  // quad VAO
  unsigned int quadVAO, quadVBO;
  glGenVertexArrays(1, &quadVAO);
  glGenBuffers(1, &quadVBO);
  glBindVertexArray(quadVAO);
  glBindBuffer(GL_ARRAY_BUFFER, quadVBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices), &quadVertices, GL_STATIC_DRAW);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(1);
  glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(2 * sizeof(float)));
  
  // 生成偏移位置数组
  glm::vec2 translations[100];
  int index = 0;
  float offset = 0.1f;
  for (int y = -10; y < 10; y += 2)
  {
      for (int x = -10; x < 10; x += 2)
      {
          glm::vec2 translation;
          translation.x = (float)x / 10.0f + offset;
          translation.y = (float)y / 10.0f + offset;
          translations[index++] = translation;
      }
  }
  // 注意这里：上传位置给glsl，只能一个一个传///////////////////////////////
  shader.use();
  for (unsigned int i = 0; i < 100; i++)
  {
      shader.setVec2(("offsets[" + to_string(i) + "]").c_str(), translations[i]);
  }
  // render loop
  while (!glfwWindowShouldClose(window))
  {
      // quad
      glBindVertexArray(quadVAO);
      // 将数据一次性发送给GPU，然后使用一个绘制函数让OpenGL利用这些数据绘制多个物体
      // 注意:第三个参数，设置需要绘制的实例数量//////////////////////////////////////////
      glDrawArraysInstanced(GL_TRIANGLES, 0, 6, 100);
  ```
  
  - 重点

    glDrawArraysInstanced(GL_TRIANGLES, 0, 6, 100);，将quad实例渲染100次

- 效果

  ![1.1效果实例化quad](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202306031800305.png)

# 实例化数组

- 引出

  由上的实例化例子，使用uniform传递变换数据，但是我们最终会**超过**最大能够发送至着色器的uniform数据大小上限。

  从而需要使用实例化数组，即不使用uniform。

- 什么是实例化数组

  - 实例化数组它被定义为一个顶点属性(可以用缓冲存储)，仅在顶点着色器渲染**一个新的实例**（可设置为两个或三个等）时才会更新。

    既然是顶点属性，则有对应的顶点缓冲对象，附加到顶点数组时需指定顶点属性布局

  - 重点

    - 原本的顶点属性，比如：位置、法线、颜色，都是在顶点着色器的**每次运行**都会让GLSL获取**新一组**适用于**当前顶点**的属性。

      - 详细说明

        注意：是当前顶点，比如：一个quad有位置和颜色信息，它有**6个**顶点（两个三角形组成），需运行**6次**顶点着色器，每一次运行顶点着色器渲染当前顶点，**都需**更新当前顶点的属性。
        
        一个实例6个顶点运行6次顶点着色器、**每**次都得更新顶点的属性。

    - 当我们将顶点属性定义为一个实例化数组时，顶点着色器就只需要对**每个实例**更新顶点属性的内容。

      - 详细说明
    
        注意：是**当前实例**，比如：一个quad有一个变换信息，即使它有**6个**顶点，需运行**6次**顶点着色器，但当每一次运行顶点着色器渲染当前顶点的变换信息是**同一个**，只需渲染完6个顶点即为一个实例时，才需要更新顶点属性的内容。
        
        一个实例6个顶点运行6次顶点着色器、**6**次后才更新顶点的属性。

## 例子1.2：100个2D四边形使用实例化数组

- 思路

  - glsl的顶点着色器

    获取每个实例的实例化数组的顶点属性

  - cpp

    - 将**实例化数组**（位置变换数据）当做顶点属性
    - 定义顶点数组，指定quad的顶点属性布局
    - 指定实例化数组（位置变换数据）的顶点属性布局，并指定对应顶点属性（顶点位置、颜色什么的）渲染几个实例时更新一次。
    - 绘制时使用glDrawArraysInstanced，将同一个quad数据渲染100次

- 代码

  glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec2 aPos;
  layout (location = 1) in vec3 aColor;
  layout (location = 2) in vec2 aOffset;// 实例化数组（位置变换数据）它被定义为一个顶点属性
  
  out vec3 fColor;
  
  void main()
  {
  	// quad的大小逐渐变大，从0.01到1
  	vec2 pos = aPos * (gl_InstanceID / 100.0);
  	gl_Position = vec4(pos + aOffset, 0.0, 1.0);
  	fColor = aColor;
  }
  ```

  cpp

  ```cpp
  // uniform数组，偏移位置
  glm::vec2 translations[100];
  int index = 0;
  float offset = 0.1f;
  for (int y = -10; y < 10; y += 2) {
      for (int x = -10; x < 10; x += 2) {
          glm::vec2 translation;
          // 控制在 -1，1之间
          translation.x = (float)x / 10.0f + offset;
          translation.y = (float)y / 10.0f + offset;
          translations[index++] = translation;
      }
  }
  // 用顶点缓冲对象存储
  unsigned int instanceVBO;
  glGenBuffers(1, &instanceVBO);
  glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(glm::vec2) * 100, &translations[0], GL_STATIC_DRAW);
  glBindBuffer(GL_ARRAY_BUFFER, 0);
  
  float quadVertices[] = {
      // 位置          // 颜色
      -0.05f,  0.05f,  1.0f, 0.0f, 0.0f,
      0.05f, -0.05f,  0.0f, 1.0f, 0.0f,
      -0.05f, -0.05f,  0.0f, 0.0f, 1.0f,
  
      -0.05f,  0.05f,  1.0f, 0.0f, 0.0f,
      0.05f, -0.05f,  0.0f, 1.0f, 0.0f,
      0.05f,  0.05f,  0.0f, 1.0f, 1.0f
  };
  
  // quad VAO
  unsigned int quadVAO, quadVBO;
  glGenVertexArrays(1, &quadVAO);
  glGenBuffers(1, &quadVBO);
  glBindVertexArray(quadVAO);
  glBindBuffer(GL_ARRAY_BUFFER, quadVBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(quadVertices), &quadVertices, GL_STATIC_DRAW);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(1);
  glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 5 * sizeof(float), (void*)(2 * sizeof(float)));
  
  // 重点：设置layout=2的属性，aOffset，实例化数组//////////////////////////////
  glEnableVertexAttribArray(2);
  glBindBuffer(GL_ARRAY_BUFFER, instanceVBO);
  glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 2 * sizeof(float), (void*)0);
  glBindBuffer(GL_ARRAY_BUFFER, 0);
  // 设置顶点layout=2布局的属性是，每1个实例更新一次属性//////////////////////////////
  glVertexAttribDivisor(2, 1); 
  // 解绑
  glBindVertexArray(0);
  glBindBuffer(GL_ARRAY_BUFFER, 0);
  
  // 记得绑定shader，即使没有数据上传给uniform
  shader.use();
  
  // render loop
  // -----------
  while (!glfwWindowShouldClose(window))
  {
      // quad
      glBindVertexArray(quadVAO);
      // 将数据一次性发送给GPU，然后使用一个绘制函数让OpenGL利用这些数据绘制多个物体
      // 注意第三个参数，设置需要绘制的实例数量
      glDrawArraysInstanced(GL_TRIANGLES, 0, 6, 100);
      glBindVertexArray(0);
  ```

  可以看到没有使用uniform，而是用顶点属性

  - glVertexAttribDivisor(2,1)

    - 第一个参数：对应glsl的layout=2，指向的aOffset

    - 第二个参数：

      0：在顶点着色器的每次迭代时更新顶点属性，**默认**的

      1：渲染**一个**新实例的时候更新顶点属性

      2：每2个实例更新一次属性

- 效果

  ![](图片/4.10实例化/1.2效果实例化数组quad.png)

## 例子2.1：行星带不使用实例化数组

- 说明

  行星周围的石头都有自己的**变换矩阵**model，每渲染一个石头时，上传自己的变换矩阵model给glsl的uniform，所以实际上是使用uniform来变换每个石头的位置，而没有用glDrawArraysInstanced或者glDrawElementsInstanced函数来用上述的实例化。

  很大的原因是因为石头是obj模型，之前声明的mesh与model类封装了渲染函数，不好变动。

- 代码

  glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 2) in vec2 aTexCoords;
  
  out vec2 TexCoords;  
  
  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;
  
  void main()
  {
      TexCoords = aTexCoords;
      gl_Position = projection * view * model * vec4(aPos, 1.0);
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec2 TexCoords;
  
  uniform sampler2D texture_diffuse1;
  
  void main(){
  	FragColor = texture(texture_diffuse1, TexCoords);
  }
  ```

  cpp

  ```cpp
  // 加载模型
  Model rock(FileSystem::getPath("assest/model/rock/rock.obj"));
  Model planet(FileSystem::getPath("assest/model/planet/planet.obj"));
  
  // model数组，石头的偏移位置
  unsigned int amount = 1000;
  glm::mat4* modelMatrices;
  modelMatrices = new glm::mat4[amount];
  srand(glfwGetTime());// 初始化随机种子
  float radius = 50.0f;
  float offset = 2.5f;
  for (unsigned int i = 0; i < amount; i++) {
      glm::mat4 model = glm::mat4(1.0f);
      // 角度，0-360度
      float angle = (float)i / (float)amount * 360.0f;
      // 1. 位移：分布在半径为 radius 的圆形上，偏移范围是[-0ffset, offset]
      // rand()范围为0~RAND_MAX, 700 % 500 = 200 / 100 = 2 - 2.5 = -0.5
      float displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
      float x = sin(angle) * radius + displacement;
  
      displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
      float y = displacement * 0.4f;
  
      displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
      float z = cos(angle) * radius + displacement;
      model = glm::translate(model, glm::vec3(x, y, z));
  
      // 2.缩放：在0.05和0.25f之间缩放
      float scale = (rand() % 20) / 100.0f + 0.05;
      model = glm::scale(model, glm::vec3(scale));
  
      // 3.旋转：绕着一个(半)随机选择的旋转轴向量进行随机的旋转
      float rotAngle = (rand() % 360);
      model = glm::rotate(model, rotAngle, glm::vec3(0.4f, 0.6f, 0.8f));
  
      // 4. 添加到矩阵的数组中
      modelMatrices[i] = model;
  }
  // render loop
  // -----------
  while (!glfwWindowShouldClose(window))
  { 
      // 摄像机
      glm::mat4 projection = glm::perspective(glm::radians(45.0f), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 1000.0f);
      glm::mat4 view = camera.GetViewMatrix();
      shader.use();
      shader.setMat4("projection", projection);
      shader.setMat4("view", view);
  
      // 绘画行星
      glm::mat4 model = glm::mat4(1.0f);
      model = glm::translate(model, glm::vec3(0.0f, -3.0f, 0.0f));
      model = glm::scale(model, glm::vec3(4.0f, 4.0f, 4.0f));
      shader.setMat4("model", model);
      planet.Draw(shader);
  
      // 绘画石头
      for (unsigned int i = 0; i < amount; i++) {
          // 设置偏移
          shader.setMat4("model", modelMatrices[i]);
          rock.Draw(shader);
      }
  ```

- 效果

  ![](图片/4.10实例化/2.1行星效果.png)

- 缺点

  由代码可见，渲染石头是用for循环+**上传uniform**，当要渲染的石头数量增加，即for循环的次数增加，调用uniform的次数会变多，而调用uniform的次数会影响性能，

  当amount=10000时，可以感到明显的卡顿（根据自己的机器配置，amount太大会感到卡顿）

## 例子2.2：行星带使用实例化数组

- 说明

  不使用原本model类封装的draw函数，而是获取mesh的顶点缓冲数组再调用实例化函数glDrawElementsInstanced。

  这样我们就可以将每个实例的**变换矩阵**（实例化数组）当做**顶点属性**

- 代码

  glsl

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 2) in vec2 aTexCoords;
  layout (location = 3) in mat4 instanceMatrix;// 实例化数组（位置变换数据）它被定义为一个顶点属性
  
  out vec2 TexCoords;  
  
  uniform mat4 view;
  uniform mat4 projection;
  
  void main()
  {
      TexCoords = aTexCoords;
      gl_Position = projection * view  * instanceMatrix*  vec4(aPos, 1.0);
  }
  
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec2 TexCoords;
  
  uniform sampler2D texture_diffuse1;
  
  void main(){
  	FragColor = texture(texture_diffuse1, TexCoords);
  }
  ```

  cpp

  ```cpp
  Shader planetshader("assest/shader/4高级OpenGL/6.10.3.渲染大量物体-行星带-无实例化.vs", "assest/shader/4高级OpenGL/6.10.3.渲染大量物体-行星带-无实例化.fs");
  Shader rockshader("assest/shader/4高级OpenGL/6.10.4.渲染大量物体-行星带-实例化数组.vs", "assest/shader/4高级OpenGL/6.10.4.渲染大量物体-行星带-实例化数组.fs");
  
  // 加载模型
  Model planet(FileSystem::getPath("assest/model/planet/planet.obj"));
  Model rock(FileSystem::getPath("assest/model/rock/rock.obj"));
  
  // model数组，石头的偏移位置
  unsigned int amount = 100000;
  glm::mat4* modelMatrices;
  modelMatrices = new glm::mat4[amount];
  srand(static_cast<unsigned int>(glfwGetTime()));// 初始化随机种子
  float radius = 150.0f;
  float offset = 25.0f;
  for (unsigned int i = 0; i < amount; i++) {
      glm::mat4 model = glm::mat4(1.0f);
      // 角度，0-360度
      float angle = (float)i / (float)amount * 360.0f;
      // 1. 位移：分布在半径为 radius 的圆形上，偏移范围是[-0ffset, offset]
      // rand()范围为0~RAND_MAX, 700 % 500 = 200 / 100 = 2 - 2.5 = -0.5
      float displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
      float x = sin(angle) * radius + displacement;
  
      displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
      float y = displacement * 0.4f;
  
      displacement = (rand() % (int)(2 * offset * 100)) / 100.0f - offset;
      float z = cos(angle) * radius + displacement;
      model = glm::translate(model, glm::vec3(x, y, z));
  
      // 2.缩放：在0.05和0.25f之间缩放
      float scale = (rand() % 20) / 100.0f + 0.05;
      model = glm::scale(model, glm::vec3(scale));
  
      // 3.旋转：绕着一个(半)随机选择的旋转轴向量进行随机的旋转
      float rotAngle = (rand() % 360);
      model = glm::rotate(model, rotAngle, glm::vec3(0.4f, 0.6f, 0.8f));
  
      // 4. 添加到矩阵的数组中
      modelMatrices[i] = model;
  }
  // 关键代码-开始///////////////////////////////////////////////////////////////////////
  // 设置给rock的model，实例化数组当做顶点属性，需要指定顶点属性布局
  unsigned int buffer;
  glGenBuffers(1, &buffer);
  glBindBuffer(GL_ARRAY_BUFFER, buffer);
  // 注意这里将数组绑定到缓冲中
  glBufferData(GL_ARRAY_BUFFER, amount * sizeof(glm::mat4), &modelMatrices[0], GL_STATIC_DRAW);
  for (unsigned int i = 0; i < rock.meshes.size(); i++) {// rock.meshes.size() = 1
      unsigned int VAO = rock.meshes[i].VAO;
      glBindVertexArray(VAO);
      // 设置mat4的顶点属性指针
      glEnableVertexAttribArray(3);
      glVertexAttribPointer(3, 4, GL_FLOAT, GL_FALSE, sizeof(glm::mat4), (void*)0);
      glEnableVertexAttribArray(4);
      glVertexAttribPointer(4, 4, GL_FLOAT, GL_FALSE, sizeof(glm::mat4), (void*)(sizeof(glm::vec4)));
      glEnableVertexAttribArray(5);
      glVertexAttribPointer(5, 4, GL_FLOAT, GL_FALSE, sizeof(glm::mat4), (void*)(2 * sizeof(glm::vec4)));
      glEnableVertexAttribArray(6);
      glVertexAttribPointer(6, 4, GL_FLOAT, GL_FALSE, sizeof(glm::mat4), (void*)(3 * sizeof(glm::vec4)));
      // layout=3矩阵的instanceMatrix顶点属性，每1个实例更新一次属性
      glVertexAttribDivisor(3, 1);
      glVertexAttribDivisor(4, 1);
      glVertexAttribDivisor(5, 1);
      glVertexAttribDivisor(6, 1);
  
      glBindVertexArray(0);
  }
  // 关键代码-结束///////////////////////////////////////////////////////////////////////
  // render loop
  // -----------
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
  
      // render
      // ------
      glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  
      // 摄像机
      glm::mat4 projection = glm::perspective(glm::radians(45.0f), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 1000.0f);
      glm::mat4 view = camera.GetViewMatrix();
      rockshader.use();
      rockshader.setMat4("projection", projection);
      rockshader.setMat4("view", view);
      planetshader.use();
      planetshader.setMat4("projection", projection);
      planetshader.setMat4("view", view);
      // 绘画行星
      planetshader.use();
      glm::mat4 model = glm::mat4(1.0f);
      model = glm::translate(model, glm::vec3(0.0f, -3.0f, 0.0f));
      model = glm::scale(model, glm::vec3(4.0f, 4.0f, 4.0f));
      planetshader.setMat4("model", model);
      planet.Draw(planetshader);
  
      // 绘画石头
      rockshader.use();
      // 绑定纹理单元
      rockshader.setInt("texture_diffuse1", 0);
      glActiveTexture(GL_TEXTURE0);
      glBindTexture(GL_TEXTURE_2D, rock.textures_loaded[0].id);;
      for (unsigned int i = 0; i < rock.meshes.size(); i++) {
          glBindVertexArray(rock.meshes[i].VAO);
          // 注意第5个参数，设置需要绘制的实例数量
          glDrawElementsInstanced(GL_TRIANGLES, rock.meshes[i].indices.size(), GL_UNSIGNED_INT, 0, amount);
          glBindVertexArray(0);
      }
  ```

  - 当矩阵当做顶点属性时

    由于顶点属性的类型只能是小于等于vec4大小，而mat4本质上是4个vec4，所以我们需要为这个矩阵预留4个顶点属性。

    因为我们将它的位置值设置为**3**，矩阵每一列的顶点属性位置值就是3、4、5和6。

- 效果

  100000个石头

  ![](图片/4.10实例化/2.2行星效果-实例数组.png)
