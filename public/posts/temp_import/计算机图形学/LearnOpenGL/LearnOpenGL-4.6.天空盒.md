为什么反射和折射的glsl

不用

​    gl_Position = pos.xyww;// z为w=1，透视除法除后还是1，深度为最远

# 天空盒

## 介绍

立方体贴图就是一个包含了6个2D纹理的纹理，每个2D纹理都组成了立方体的一个面：一个有纹理的**立方体**。

## 如何采样

  ![](图片/4.6天空盒/cubemaps_sampling.png)

  - 方向向量的大小并不重要，只要提供了**方向**，OpenGL就会获取**方向向量**（最终）所击中的纹素，并返回对应的采样纹理值。
  - 只要立方体的中心位于**原点**，我们就能使用立方体的实际位置向量来对立方体贴图进行采样了。
  - 我们可以将所有顶点的纹理坐标当做是**立方体的顶点位置**。最终得到的结果就是可以访问立方体贴图上正确面(Face)纹理的一个纹理坐标。

立方体有36个顶点位置，在顶点着色器后每个片段都有自己的顶点位置，采样天空盒时用这个**顶点位置**当做纹理坐标即可。

## OpenGL纹理目标

![](图片/4.6天空盒/cubemaps_skybox.png)

| 纹理目标                         | 方位 |
| :------------------------------- | :--- |
| `GL_TEXTURE_CUBE_MAP_POSITIVE_X` | 右   |
| `GL_TEXTURE_CUBE_MAP_NEGATIVE_X` | 左   |
| `GL_TEXTURE_CUBE_MAP_POSITIVE_Y` | 上   |
| `GL_TEXTURE_CUBE_MAP_NEGATIVE_Y` | 下   |
| `GL_TEXTURE_CUBE_MAP_POSITIVE_Z` | 后   |
| `GL_TEXTURE_CUBE_MAP_NEGATIVE_Z` | 前   |

## 例子0：天空盒效果

- 加载天空盒

  ```cpp
  // 加载纹理// -------------
  unsigned int cubeTexture = loadTexture(FileSystem::getPath("assest/textures/container.jpg").c_str());
  // 加载天空盒
  vector<std::string> faces{
      FileSystem::getPath("assest/textures/skybox/right.jpg"),
      FileSystem::getPath("assest/textures/skybox/left.jpg"),
      FileSystem::getPath("assest/textures/skybox/top.jpg"),
      FileSystem::getPath("assest/textures/skybox/bottom.jpg"),
      FileSystem::getPath("assest/textures/skybox/front.jpg"),
      FileSystem::getPath("assest/textures/skybox/back.jpg")
  };
  unsigned int cubemapTexture = loadCubemap(faces);
  // 加载天空盒
  // 加载顺序
  // order:
  // +X (right)
  // -X (left)
  // +Y (top)
  // -Y (bottom)
  // +Z (front) 
  // -Z (back)
  unsigned int loadCubemap(vector<std::string> faces) {
      unsigned int textureID;
      glGenTextures(1, &textureID);
      glBindTexture(GL_TEXTURE_CUBE_MAP, textureID);
  
      int width, height, nrChannels;
      for (unsigned int i = 0; i < faces.size(); i++) {
          unsigned char* data = stbi_load(faces[i].c_str(), &width, &height, &nrChannels, 0);
          if (data) {
              glTexImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, GL_RGB, width, height, 0, GL_RGB, GL_UNSIGNED_BYTE, data);
              stbi_image_free(data);
          }
          else {
              std::cout << "Cubemap texture failed to load at path:" << faces[i] << std::endl;
              stbi_image_free(data);
          }
      }
      glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MIN_FILTER, GL_LINEAR);;
      glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_MAG_FILTER, GL_LINEAR);;
      glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);;
      glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);;
      glTexParameteri(GL_TEXTURE_CUBE_MAP, GL_TEXTURE_WRAP_R, GL_CLAMP_TO_EDGE);;
  
      return textureID;
  }
  ```

- 为天空盒创建立方体的六个面的顶点数据以及VAO VBO

  ```cpp
  // skybox VAO
  unsigned int skyboxVAO, skyboxVBO;
  glGenVertexArrays(1, &skyboxVAO);
  glGenBuffers(1, &skyboxVBO);
  glBindVertexArray(skyboxVAO);
  glBindBuffer(GL_ARRAY_BUFFER, skyboxVBO);
  glBufferData(GL_ARRAY_BUFFER, sizeof(skyboxVertices), &skyboxVertices, GL_STATIC_DRAW);
  glEnableVertexAttribArray(0);
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glBindVertexArray(0);
  ```

- 渲染

  ```cpp
  glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  glEnable(GL_DEPTH_TEST);
  
  glm::mat4 model = glm::mat4(1.0f);
  glm::mat4 view = camera.GetViewMatrix();
  glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
  
  // 渲染立方体
  shader.use();
  view = camera.GetViewMatrix();
  shader.setMat4("model", model);// 不变，在中心
  shader.setMat4("view", view);
  shader.setMat4("projection", projection);
  glBindVertexArray(cubeVAO);
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_2D, cubeTexture);
  glDrawArrays(GL_TRIANGLES, 0, 36);
  glBindVertexArray(0);
  
  // 渲染天空盒
  // 重点代码：小于等于。由于深度缓冲区的默认值为1，而到顶点着色器里设置了天空盒的深度值为1，所以要为小于等于,1=1,测试才通过才到片段着色器采样颜色
  glDepthFunc(GL_LEQUAL);
  skyboxShader.use();
  //view = camera.GetViewMatrix();
  // 重点代码：取4x4矩阵左上角的3x3矩阵来移除变换矩阵的位移部分，再变回4x4矩阵。///////////////////////////////////
  // 防止摄像机移动，天空盒会受到视图矩阵的影响而改变位置，即摄像机向z后退，天空盒和cube向z前进
  view = glm::mat4(glm::mat3(camera.GetViewMatrix()));
  skyboxShader.setMat4("view", view);
  skyboxShader.setMat4("projection", projection);
  glBindVertexArray(skyboxVAO);
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_CUBE_MAP, cubemapTexture);// 第一个参数从GL_TEXTURE_2D 变为GL_TEXTURE_CUBE_MAP
  glDrawArrays(GL_TRIANGLES, 0, 36);
  glBindVertexArray(0);
  glDepthFunc(GL_LESS);
  ```

- glsl和采样

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  
  // 纹理坐标是3维的
  out vec3 TexCoords;
  // 不用model转换到世界矩阵
  uniform mat4 projection;
  uniform mat4 view;
  void main()
  {
      // 纹理坐标等于位置坐标/////////////////////////////////////////////////////////////////////////////
      TexCoords = aPos;
      vec4 pos = projection * view * vec4(aPos, 1.0);
      // z为w，透视除法除后z=(z=w/w)=1，深度为最远///////////////////////////////////////////////////////
      gl_Position = pos.xyww;
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  // 纹理坐标是3维的
  in vec3 TexCoords;// 纹理坐标
  
  // 天空盒纹理采样
  uniform samplerCube skybox;
  
  void main(){ 
      FragColor = texture(skybox, TexCoords);
  }
  ```

- 关键地方

  - 天空盒不会跟随摄像机移动

    ```cpp
    // 重点代码：取4x4矩阵左上角的3x3矩阵来移除变换矩阵的位移部分，再变回4x4矩阵。////////////////////
    // 防止摄像机移动，天空盒会受到视图矩阵的影响而改变位置，即摄像机向z后退，天空盒和cube向z前进
    view = glm::mat4(glm::mat3(camera.GetViewMatrix()));
    ```

  - 天空盒后渲染，也不会覆盖先前绘制的物体

    - 先绘制其它物体

    - 设置深度测试为**小于等于**

    - 绘制天空盒

      在天空盒的顶点着色器运行后，会执行**透视除法**，将gl_Position的`xyz`坐标**除以**w分量，将gl_Position的`xyz`坐标除以w分量（透视除法所做）。

      所以我们设置天空盒的z为w，z=(z=w/w)=1

      ```cpp
      gl_Position = pos.xyww;// z为w，透视除法除后z=(z=w/w)=1，深度为最远
      ```

    - 由于深度测试为小于等于（结合下面图示）

      - 在其他物体**已**占据片段的深度缓冲值<=1

        天空盒的深度值1**不**小于等于这些片段的缓冲值，所以**不会通**过深度测试，从而保持原有的物体片段颜色。
      
      - 其他物体**未**占据片段深度缓冲的**默认值为1**
      
        天空盒的深度值1小于等于深度缓冲的值1，所以**会通过**深度测试，从而**输出**天空盒片段。
    
    - 错误做法，将深度测试为默认的**小于**
    
      - 其他物体**未**占据片段深度缓冲的**默认值为1**
    
        天空盒的深度值1**不小于**深度缓冲区的**默认值1**，**不会通过**深度测试，从而具有天空盒的颜色的片段不会输出到屏幕上。

- 效果

  ![](图片/4.6天空盒/1.天空盒效果.png)

# 环境映射

- 什么是环境映射

  通过使用环境的立方体贴图，我们可以给物体**反射**和**折射**的属性。

  这样使用环境立方体贴图的技术叫做环境映射(Environment Mapping)，其中最流行的两个是反射(Reflection)和折射(Refraction)。

## 反射

- 原理图

  ![](图片/4.6天空盒/cubemaps_reflection_theory.png)

  

### 例子1：Cube反射

- 代码

  立方体的shader，天空盒的shader不变（还是和上面例子：天空盒效果的一样）

   ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 1) in vec3 aNormal;
  
  out vec3 Normal;
  out vec3 Position;
  
  uniform mat4 projection;
  uniform mat4 model;
  uniform mat4 view;
  void main()
  {
      // 法线矩阵
      Normal = mat3(transpose(inverse(model))) * aNormal;
      // 到世界空间
      Position = vec3(model * vec4(aPos, 1.0));
      // 这里不再是gl_Position = pos.xyww;因为这是中间立方体的，不是天空盒的shader
      gl_Position = projection * view * vec4(aPos, 1.0); 
  }
   ```

    ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec3 Normal;
  in vec3 Position; // 片段的坐标-世界空间
  
  uniform vec3 cameraPos;
  
  // 天空盒纹理采样
  uniform samplerCube skybox;
  
  void main(){ 
      // 从眼睛位置指向片段位置
      vec3 I = normalize(Position - cameraPos);
      vec3 R = reflect(I, normalize(Normal));
      // 采样天空盒的uv坐标是3维的
      FragColor = vec4(texture(skybox, R).rgb, 1.0);// FragColor = texture(skybox, R); 这个效果一样
  }
    ```

    cpp

    ```cpp
  Shader shader("assest/shader/4高级OpenGL/6.2.1.cube-反射天空盒.vs", "assest/shader/4高级OpenGL/6.2.1.cube-反射天空盒.fs");
  Shader skyboxShader("assest/shader/4高级OpenGL/6.1.1.天空盒-普通效果.vs", "assest/shader/4高级OpenGL/6.1.1.天空盒-普通效果.fs");
  .....
  // shader configuration
  // --------------------
  shader.use();
  shader.setInt("skybox", 0);
  
  skyboxShader.use();
  skyboxShader.setInt("skybox", 0);
  
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_CUBE_MAP, cubemapTexture);// 第一个参数从GL_TEXTURE_2D 变为GL_TEXTURE_CUBE_MAP
  
  // render loop
  // -----------
  while (!glfwWindowShouldClose(window))
  {
      // 渲染立方体
      shader.use();
      view = camera.GetViewMatrix();
      shader.setMat4("model", model);// 不变，在中心
      shader.setMat4("view", view);
      shader.setMat4("projection", projection);
      // 为了反射传入
      shader.setVec3("cameraPos", camera.Position);
      glBindVertexArray(cubeVAO);
      glDrawArrays(GL_TRIANGLES, 0, 36);
      glBindVertexArray(0);
      // 其它和天空盒的代码一样
    ```

- 效果

  ![](图片/4.6天空盒/2.1天空盒效果-反射.png)

  箱子上的贴图是**后面**的天空盒贴图

### 例子2：模型反射

- 代码

  立方体的shader，天空盒的shader不变（还是和上面例子：天空盒效果的一样）

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 1) in vec3 aNormal;
  layout (location = 2) in vec2 aTexCoords;
  
  out vec3 Normal;
  out vec3 Position; // 片段的坐标-世界空间
  out vec2 TexCoords;// 纹理坐标
  
  uniform mat4 model;
  uniform mat4 view;
  uniform mat4 projection;
  
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);
      TexCoords = aTexCoords;
      // 到世界空间
      Position = vec3(model * vec4(aPos, 1.0));
      // 这里不再是gl_Position = pos.xyww;因为这是中间立方体的，不是天空盒的shader
      Normal = mat3(transpose(inverse(model))) * aNormal;
  }
  ```

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec3 Normal;
  in vec3 Position; // 片段的坐标-世界空间
  in vec2 TexCoords;// 纹理坐标
  
  uniform vec3 cameraPos;
  uniform sampler2D texture_diffuse1;
  uniform sampler2D texture_specular1;
  uniform sampler2D texture_height1;
  
  // 天空盒纹理采样
  uniform samplerCube skybox;
  
  void main(){ 
      vec3 I = normalize(Position - cameraPos);
      vec3 R = reflect(I, normalize(Normal));
      // 采样镜面光贴图颜色（uv坐标是2维的）
      vec4 specular4 = texture(texture_specular1, TexCoords); // 采样出来的颜色是4维的
      vec3 specular3 = specular4.rgb;
      // 采样天空盒颜色（uv坐标是3维的）并乘以镜面光贴图颜色
      FragColor = vec4(texture(skybox, R).rgb * specular3, 1.0) ;
      // FragColor = vec4(texture(skybox, R).rgb, 1.0) ;// 未乘以镜面光贴图颜色
  }
  ```

  cpp

  ```cpp
  // 加载模型
  Model ourModel(FileSystem::getPath("assest/model/nanosuit/nanosuit.obj"));
  
  // shader configuration
  // --------------------
  shader.use();
  shader.setInt("skybox", 4);
  
  skyboxShader.use();
  skyboxShader.setInt("skybox", 4);
  // 设置的天空盒的纹理单元位置，好像不会与普通的纹理冲突，但保险起见还是设为4
  glActiveTexture(GL_TEXTURE4);
  glBindTexture(GL_TEXTURE_CUBE_MAP, cubemapTexture);// 第一个参数从GL_TEXTURE_2D 变为GL_TEXTURE_CUBE_MAP
  
  while (!glfwWindowShouldClose(window))
  {
      // 渲染这个模型
      // 为了反射传入
      model = glm::translate(model, glm::vec3(0.0f, 0.0f, 0.0f));
      model = glm::scale(model, glm::vec3(0.1f, 0.1f, 0.1f));
      shader.use();
      shader.setVec3("cameraPos", camera.Position);
      shader.setMat4("model", model);
      shader.setMat4("view", view);
      shader.setMat4("projection", projection);
      ourModel.Draw(shader);
  }
  ```

- 效果

  采样天空盒颜色，**未乘以**镜面光贴图颜色

  ![](图片/4.6天空盒/2.2.1天空盒效果-模型反射-未添加反射贴图.png)

  采样天空盒颜色，并**乘以**镜面光贴图颜色

  ![](图片/4.6天空盒/2.2.2天空盒效果-模型反射-添加镜面光贴图做反射贴图.png)

## 折射

- 原理

  ![](图片/4.6天空盒/cubemaps_refraction_theory.png)

- 折射率表

  | 材质 | 折射率 |
  | :--- | :----- |
  | 空气 | 1.00   |
  | 水   | 1.33   |
  | 冰   | 1.309  |
  | 玻璃 | 1.52   |
  | 钻石 | 2.42   |

  例子中，光线/视线从**空气**(折射率1）进入**玻璃**（如果我们假设箱子是玻璃制的），所以比值为1.00/1.52=0.658

### 例子1：Cube折射

- 代码

  和反射的代码差不多，就是中间立方体的glsl片段着色器代码不一样

  ```cpp
  void main(){ 
      float ratio = 1.00 / 1.52;
      vec3 I = normalize(Position - cameraPos);
      vec3 R = refract(I, normalize(Normal), ratio);// refract，第三个参数是折射率
  
      // 采样天空盒颜色（uv坐标是3维的）
      FragColor = vec4(texture(skybox, R).rgb, 1.0);// FragColor = texture(skybox, R); 这个效果一样
  }
  ```

- 效果

  ![](图片/4.6天空盒/2.3.1天空盒效果-cube折射.png)


### 例子2：模型折射

- 代码

  ```cpp
  void main(){ 
      float ratio = 1.00 / 1.52;
      vec3 I = normalize(Position - cameraPos);
      vec3 R = refract(I, normalize(Normal), ratio);// refract，第三个参数是折射率
  
      // 采样天空盒颜色（uv坐标是3维的）
      FragColor = vec4(texture(skybox, R).rgb, 1.0);// FragColor = texture(skybox, R); 这个效果一样
  }
  ```

- 效果

  ![](图片/4.6天空盒/2.3.2天空盒效果-模型折射.png)

# 测试-先渲染天空盒再渲染物体，默认深度LESS比较方式

- 代码

  ```cpp
  // 将天空盒的盒子长宽为20
  float skyboxVertices[] = {
      // positions          
      -10.0f,  10.0f, -10.0f,
      -10.0f, -10.0f, -10.0f,
      .....
  };
  // 渲染天空盒
  //glDepthFunc(GL_LEQUAL); // 不用LEQUAL而是默认的LESS
  skyboxShader.use();
  // 重点代码：取4x4矩阵左上角的3x3矩阵来移除变换矩阵的位移部分，再变回4x4矩阵。
  // 防止摄像机移动，天空盒会受到视图矩阵的影响而改变位置，即摄像机向z后退，天空盒和cube向z前进
  view = glm::mat4(glm::mat3(camera.GetViewMatrix()));
  skyboxShader.setMat4("view", view);
  skyboxShader.setMat4("projection", projection);
  glBindVertexArray(skyboxVAO);
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_CUBE_MAP, cubemapTexture);// 第一个参数从GL_TEXTURE_2D 变为GL_TEXTURE_CUBE_MAP
  glDrawArrays(GL_TRIANGLES, 0, 36);
  glBindVertexArray(0);
  //glDepthFunc(GL_LESS);
  
  // 渲染立方体
  shader.use();
  view = camera.GetViewMatrix();
  shader.setMat4("model", model);// 不变，在中心
  shader.setMat4("view", view);
  shader.setMat4("projection", projection);
  glBindVertexArray(cubeVAO);
  glActiveTexture(GL_TEXTURE0);
  glBindTexture(GL_TEXTURE_2D, cubeTexture);
  glDrawArrays(GL_TRIANGLES, 0, 36);
  glBindVertexArray(0);
  ```

  天空盒的顶点位置z透视除法后不为1

  ```cpp
  //gl_Position = pos.xyww;// z=w，透视除法除后还是1，深度为最远
  gl_Position= projection * view * vec4(aPos, 1.0);
  ```

- 解释代码顺序

  - 天空盒的盒子长宽为**20**

  - 先绘制天空盒，再绘制箱子

  - 这代码天空盒将不会受摄像机的观察矩阵的**位移部分**影响

    所以虽然glsl天空盒的深度值z未设置w，但是**视觉上**依旧是无限远

    不过**实际上**现在代码造成的影响是，不论摄像机所在什么位置，以摄像机为原点，处在一个20\*20大小的立方体盒子**里**，在20*20范围内的物体被显示，20\*20外的物体被天空盒颜色所覆盖。
    
    换句话说：注意摄像机在原点，所以20\*20的盒子半径为10，于是原点为出发点距离摄像机长度**小于**10的物体会显示，**大于**10的物体会被天空盒颜色所覆盖。

- 进一步解释（结合下方图）

  - 箱子离摄像机的距离 <10（第一幅图）

    箱子的深度值**小于**天空盒，所以天空盒同箱子所占的片段区域会被丢弃，显示箱子的片段颜色

  - 箱子离摄像机的距离 > 10（第二幅图）

    箱子的深度值**大于**天空盒，所以天空盒同箱子所占的片段区域会覆盖箱子，显示天空盒的片段颜色

  ![](图片/4.6天空盒/天空盒不跟随移动且在前面渲染/1.png)

  ![](图片/4.6天空盒/天空盒不跟随移动且在前面渲染/2.png)
