# 几何着色器

- 简介

  - 在顶点和片段着色器之间有一个**可选**的几何着色器
  - 几何着色器的输入是一个图元（如点或三角形）的一组顶点。
  - 几何着色器可以在顶点发送到下一着色器阶段之前对它们**随意变换**

- 代码例子

  ```cpp
  #version 330 core
  layout (points) in;// 输入的图元类型
  layout (line_strip, max_vertices = 2) out;// 几何着色器输出的图元类型
  
  void main() {    
      gl_Position = gl_in[0].gl_Position + vec4(-0.1, 0.0, 0.0, 0.0); 
      EmitVertex();
  
      gl_Position = gl_in[0].gl_Position + vec4( 0.1, 0.0, 0.0, 0.0);
      EmitVertex();
  
      EndPrimitive();
  }
  ```

  - **输入**的图元类型：layout (points) in;
    - `points`：绘制GL_POINTS图元时（一个图元包含最小1个顶点数）。
    - `lines`：绘制GL_LINES或GL_LINE_STRIP时（2）
    - `lines_adjacency`：GL_LINES_ADJACENCY或GL_LINE_STRIP_ADJACENCY（4）
    - `triangles`：GL_TRIANGLES、GL_TRIANGLE_STRIP或GL_TRIANGLE_FAN（3）
    - `triangles_adjacency`：GL_TRIANGLES_ADJACENCY或GL_TRIANGLE_STRIP_ADJACENCY（6）
  - 几何着色器**输出**的图元类型：layout (line_strip, max_vertices = 2) out;
    - `points`
    - `line_strip`
    - `triangle_strip`

- 说明line_strip

  layout (line_strip, max_vertices = 5) out;

  ![](图片/4.9几何着色器/geometry_shader_line_strip.png)

- 内建变量

  我们需要某种方式来获取**前一**着色器阶段的输出

  ```cpp
  in gl_Vertex// 4.8节讲的接口块
  {
      vec4  gl_Position;
      float gl_PointSize;
      float gl_ClipDistance[];
  } gl_in[];
  ```

  要注意的是，它被声明为一个数组，因为大多数的渲染图元包含**多于1个**的顶点，而几何着色器的**输入**是一个图元的**所有**顶点。

- 生成线条

  ```cpp
  void main() {
      gl_Position = gl_in[0].gl_Position + vec4(-0.1, 0.0, 0.0, 0.0); 
      EmitVertex();// gl_Position添加到图元中
  
      gl_Position = gl_in[0].gl_Position + vec4( 0.1, 0.0, 0.0, 0.0);
      EmitVertex();
  
      EndPrimitive();// 合成
  }
  ```

  - 每次我们调用**EmitVertex**时，gl_Position中的向量会被**添加**到图元中来
  - 当**EndPrimitive**被调用时，所有发射出的(Emitted)顶点都会**合成**为指定的输出渲染图元。

# 使用几何着色器

## 造几个房子

- 分析

  我们可以将几何着色器的**输出**设置为triangle_strip，并绘制三个三角形：其中两个组成一个正方形，另一个用作房顶。

- triangle_strip说明

  - 在第一个三角形绘制完之后，每个后续顶点将会在上一个三角形边上生成另一个三角形：每3个临近的顶点将会形成一个三角形

  - 例子

    顶点为：123456

    生成的三角形有：(1, 2, 3)、(2, 3, 4)、(3, 4, 5)和(4, 5, 6)，共形成4个三角形

  - 图示

    ![](图片/4.9几何着色器/geometry_shader_triangle_strip.png)

- 从而推出房子需要的顶点，以及顺序

  顶点为：123456

  生成的三角形有：(1, 2, 3)、(2, 3, 4)和(3, 4, 5)，共形成3个三角形

  ![](图片/4.9几何着色器/geometry_shader_house.png)

- 代码

  ```cpp
  #version 330 core
  layout (points) in;//输入
  layout (triangle_strip, max_vertices = 5) out;// 输出，5个顶点
  
  in VS_OUT{// 4.8节讲的接口块
  	vec3 color;
  }gs_in[];
  
  out vec3 fColor;
  
  void build_house(vec4 position){
  	// 因为points只有一个顶点，所以下标为0
  	fColor = gs_in[0].color;//1234顶点使用同一个颜色
  	gl_Position = position + vec4(-0.2, -0.2, 0.0, 0.0);// 1:左下
  	EmitVertex();
  	gl_Position = position + vec4( 0.2, -0.2, 0.0, 0.0);// 2:右下
  	EmitVertex();
  	gl_Position = position + vec4(-0.2,  0.2, 0.0, 0.0);// 3:左上
  	EmitVertex();
  	gl_Position = position + vec4( 0.2,  0.2, 0.0, 0.0);// 4:右上
  	EmitVertex();
  	gl_Position = position + vec4( 0.0,  0.4, 0.0, 0.0); // 5:顶部
  	fColor = vec3(1.0, 1.0, 1.0);// 顶部颜色为白色
  	EmitVertex();
  	EndPrimitive();
  }
  void main(){
  	build_house(gl_in[0].gl_Position);
  }
  ```

  ```cpp
  float points[] = {
      -0.5f,  0.5f, 1.0f, 0.0f, 0.0f, // top-left
      0.5f,  0.5f, 0.0f, 1.0f, 0.0f, // top-right
      0.5f, -0.5f, 0.0f, 0.0f, 1.0f, // bottom-right
      -0.5f, -0.5f, 1.0f, 1.0f, 0.0f  // bottom-left
  };
  
  glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
  glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
  glEnable(GL_DEPTH_TEST);
  
  shader.use();
  glBindVertexArray(VAO);
  glDrawArrays(GL_POINTS, 0 ,4);
  ```

- 效果

  ![](图片/4.9几何着色器/房子.png)

## 爆破物体

- 分析

  我们是要将每个三角形沿着法向量的方向移动一小段时间。效果就是，整个物体看起来像是沿着每个三角形的法线向量**爆炸**一样。

- 代码

  vs：顶点着色器

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 2) in vec2 aTexCoords;
  
  out VS_OUT{// 4.8的接口块
      vec2 texCoords;
  }vs_out;
  
  uniform mat4 projection;
  uniform mat4 model;
  uniform mat4 view;
  
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);// 变换到裁剪空间
      vs_out.texCoords = aTexCoords;
  }
  
  ```

  gs：几何着色器-关键地方

  ```cpp
  #version 330 core
  layout (triangles) in;
  layout (triangle_strip, max_vertices = 3) out;// 输出，3个顶点
  
  // 从顶点着色器传入
  in VS_OUT{
  	vec2 texCoords;
  }gs_in[];
  
  // 为了传入给片段着色器
  out vec2 TexCoords;
  
  uniform float time;
  
  vec4 explode(vec4 position, vec3 normal){
  	float magnitude = 2.0;
  	// 将每个三角形沿着法向量的方向移动一小段时间
  	vec3 direction = normal * ((sin(time) + 1.0) / 2.0) * magnitude;
  	return position + vec4(direction, 0.0);
  }
  // 计算法线
  vec3 GetNormal(){
  	vec3 a = vec3(gl_in[0].gl_Position) - vec3(gl_in[1].gl_Position);
  	vec3 b = vec3(gl_in[2].gl_Position) - vec3(gl_in[1].gl_Position);
  	return normalize(cross(a, b));// a、b向量的叉积：第三个向量（法线）并垂直于a、b
  }
  void main(){
  	vec3 normal = GetNormal();
  	gl_Position = explode(gl_in[0].gl_Position, normal);
  	TexCoords = gs_in[0].texCoords;
  	EmitVertex();
  
  	gl_Position = explode(gl_in[1].gl_Position, normal);
  	TexCoords = gs_in[1].texCoords;
  	EmitVertex();
  
  	gl_Position = explode(gl_in[2].gl_Position, normal);
  	TexCoords = gs_in[2].texCoords;
  	EmitVertex();
  
  	EndPrimitive();
  }
  ```

  分析：

  - vs顶点着色器将顶点变换到裁剪空间后**传给**几何着色器
  - 几何着色器的顶点处于**裁剪空间**中，那么这里计算的法线是计算**裁剪空间顶点的法线**

  fs

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
  // 渲染这个模型
  model = glm::translate(model, glm::vec3(0.0f, 0.0f, 0.0f));
  model = glm::scale(model, glm::vec3(0.1f, 0.1f, 0.1f));
  shader.use();
  shader.setMat4("model", model);
  shader.setMat4("view", view);
  shader.setMat4("projection", projection);
  
  shader.setFloat("time", static_cast<float>(glfwGetTime()));
  ```

- 效果

  ![](图片/4.9几何着色器/2.2模型爆炸.png)

  ![](图片/4.9几何着色器/2.1模型爆炸.png)

  

## 法向量可视化

- 引出

  检测法向量是否正确的一个很好的方式就是对它们进行可视化，几何着色器正是实现这一目的非常有用的工具。

- 实现思路

  - 我们首先**不使用**几何着色器正常绘制场景

  - 然后再次绘制场景，但这次**只显示**通过几何着色器生成法向量。

    几何着色器接收一个三角形图元，并沿着法向量生成三条线——>每个顶点一个法向量

- 代码

  法线可视化的着色器

  vs

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 1) in vec3 aNormal;
  
  out VS_OUT{
      vec3 normal;
  }vs_out;
  
  uniform mat4 model;
  uniform mat4 view;
  
  void main()
  {
      gl_Position = view * model * vec4(aPos, 1.0);// 顶点变换到观察空间
      // 注意：将法线变换到观察空间
      mat3 normalMatrix = mat3(transpose(inverse(view * model)));
      vs_out.normal = normalize(vec3(vec4(normalMatrix * aNormal, 0.0)));
  }
  ```

  gs

  ```cpp
  #version 330 core
  layout (triangles) in; // 输入：一个三角形3个顶点
  layout (line_strip, max_vertices = 6) out;// 输出：3条线，每条线2个顶点，共6个顶点
  
  // 从顶点着色器传入
  in VS_OUT{
  	vec3 normal;
  }gs_in[];
  
  const float MAGNITUDE = 0.02;
  
  uniform mat4 projection;// 投影矩阵
  // 从点变成线
  void GenerateLine(int index){
  	gl_Position = projection * gl_in[index].gl_Position;// 起始点变换到裁剪空间
  	EmitVertex();
  	// 1.在观察空间中线的终顶点沿着法线增长 2.顶点再变换到裁剪空间
  	gl_Position = projection * (gl_in[index].gl_Position + 
  								vec4(gs_in[index].normal, 0.0) * MAGNITUDE);
  	EmitVertex();
  	EndPrimitive();
  }
  
  void main(){
  	GenerateLine(0);
  	GenerateLine(1);
  	GenerateLine(2);
  }
  ```

  分析：

  - vs顶点着色器将顶点变换到**观察空间**后传给几何着色器

    所以法线也要变换到观察空间再传给几何着色器

  - 几何着色器的顶点

    - 在观察空间沿着法线**增长**

      ```
      (gl_in[index].gl_Position + vec4(gs_in[index].normal, 0.0) * MAGNITUDE)
      ```

    - 增长后的顶点与projection投影矩阵相乘在**裁剪空间**

      然后传给片段着色器之前：经过透视除法到**标准化设备坐标系**，再经过视口变换到**屏幕坐标**（opengl自动执行）

  fs

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  void main(){ 
  	FragColor = vec4(1.0, 1.0, 0.0, 1.0);
  }
  ```

  cpp

  ```cpp
  Shader shader("assest/shader/3模型/3.1.模型加载.vs", "assest/shader/3模型/3.1.模型加载.fs");
  Shader normalshader("assest/shader/4高级OpenGL/6.9.3.几何着色器-模型法向量可视化.vs", "assest/shader/4高级OpenGL/6.9.3.几何着色器-模型法向量可视化.fs", "assest/shader/4高级OpenGL/6.9.3.几何着色器-模型法向量可视化.gs");
  while (!glfwWindowShouldClose(window))
  {
      glm::mat4 model = glm::mat4(1.0f);
      glm::mat4 view = camera.GetViewMatrix();
      glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
  
      // 渲染这个模型
      model = glm::translate(model, glm::vec3(0.0f, 0.0f, 0.0f));
      model = glm::scale(model, glm::vec3(0.1f, 0.1f, 0.1f));
      shader.use();
      shader.setMat4("model", model);
      shader.setMat4("view", view);
      shader.setMat4("projection", projection);
      ourModel.Draw(shader);
  
      // 由几何着色器的设置，顶点的位置，渲染为法线
      normalshader.use();
      normalshader.setMat4("model", model);
      normalshader.setMat4("view", view);
      normalshader.setMat4("projection", projection);
      ourModel.Draw(normalshader);
  ```

- 效果

  ![](图片/4.9几何着色器/3.1法向量可视化.png)

- 疑问点

  为什么要在**观察空间**中顶点沿着法线增长变成线。

  几何着色器不可以直接在裁剪空间下对顶点增长吗？

  测试代码：

  ```cpp
  void main()
  {	// 顶点变换到裁剪空间
      gl_Position = projection * view * model * vec4(aPos, 1.0);
      // 将法线变换到裁剪空间
      mat3 normalMatrix = mat3(transpose(inverse(projection * view * model)));
      vs_out.normal = normalize(vec3(vec4(normalMatrix * aNormal, 0.0)));
  }
  ```
  
  ```cpp
  void GenerateLine(int index){
      // 已经在裁剪空间下，不需要乘以投影矩阵了
  	gl_Position =  gl_in[index].gl_Position;
  	EmitVertex();
  
  	gl_Position = (gl_in[index].gl_Position + 
  								vec4(gs_in[index].normal, 0.0) * MAGNITUDE);
  	EmitVertex();
  	EndPrimitive();
  }
  ```
  
  ![](图片/4.9几何着色器/3.2法向量可视化-裁剪空间进行.png)

  会发现绘制出来的线很奇怪

  个人猜测：
  
  - 前置知识
  
    由1.8所讲的坐标系统中提到的：一旦顶点进入到裁剪空间，那么OpenGL会自动执行
    
    1. 透视除法到**标准化设备坐标系**
    
    2. 再经过视口变换到**屏幕坐标**
    
  - 所以
  
    在几何着色器的时候，顶点此时不在裁剪空间，而是在**屏幕坐标系**，从而绘制出来的法线不正确！
