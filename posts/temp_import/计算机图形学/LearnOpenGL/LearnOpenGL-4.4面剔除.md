# 面剔除

- 作用

  OpenGL能够检查所有面向(Front Facing)观察者的面，并渲染它们，而丢弃那些**背向**(Back Facing)的面，节省我们很多的片段着色器调用（它们的开销很大！）。

  但我们仍要告诉OpenGL哪些面是正向面(Front Face)，哪些面是背向面(Back Face)。OpenGL使用了一个很聪明的技巧，分析顶点数据的**环绕顺序**(Winding Order)。

- 记住

  确认在每个三角形中它们都是以**逆时针**定义的，这是一个很好的习惯

# 环绕顺序

- 顺时针(Clockwise)的，也可能是逆时针(Counter-clockwise)的

  ![](图片/4.4面剔除/faceculling_windingorder.png)

- 代码角度

  ```cpp
  float vertices[] = {
      // 顺时针
      vertices[0], // 顶点1
      vertices[1], // 顶点2
      vertices[2], // 顶点3
      // 逆时针
      vertices[0], // 顶点1
      vertices[2], // 顶点3
      vertices[1]  // 顶点2  
  };
  ```

  每组组成三角形图元的三个顶点就包含了一个环绕顺序。OpenGL在渲染图元的时候将使用这个信息来决定一个三角形是一个正向三角形还是背向三角形。

  **默认**情况下，**逆时针顶点所定义的三角形将会被处理为正向三角形**。

- 解释这默认情况下

  当你定义顶点顺序的时候，你应该想象对应的三角形是面向你的，所以你定义的三角形从**正**面看去应该是**逆时针**的。

  这样定义顶点**很棒的一点**是，实际的环绕顺序是在光栅化阶段进行的，也就是顶点着色器运行之后。这些顶点就是从**观察者视角**所见的了。

- 图示

  我们所**面向**的三角形将会是**正向**三角形，而**背向面**的三角形则是**背向**三角形

  ![faceculling_frontback](图片/4.4面剔除/faceculling_frontback.png)

  - 解释

    两个三角形都以**逆时针**顺序定义

    如果从观察者当前视角使用1、2、3的顺序来绘制的话，从观察者的方向来看，**背**向面的三角形将会是以**顺**时针顺序渲染。**正**向面的三角形将会是以**逆**时针顺序渲染。

  - 重点

    结合图：虽然**背**向面的三角形是以**逆时针定义**的，但以现在视角的角度它现在是以**顺**时针顺序渲染的了。这正是我们想要**剔除**（Cull，丢弃）的不可见面了！
    
    **正**向面的三角形也是以**逆时针**定义的，但以现在视角的角度它现在依旧是以**逆时针顺序渲染**的。

# 面剔除

- 启用

  OpenGL默认是关闭的

  ```cpp
  glEnable(GL_CULL_FACE);
  ```

- OpenGL允许我们改变需要剔除的面的类型

  ```cpp
  glCullFace(GL_FRONT); 
  ```

  - `GL_BACK`：只剔除**背**向面。
  - `GL_FRONT`：只剔除**正**向面。
  - `GL_FRONT_AND_BACK`：剔除正向面和背向面。

- 告诉OpenGL我们希望将顺时针还是逆时针的面定义为**正向面**
  - GL_CCW:逆时针的环绕顺序是正面（默认）
  - GL_CW：顺时针的环绕顺序是正面

## 测试1：顶点环绕顺序不按照时钟定义，开启剔除并且默认逆时针的环绕顺序是正面

```cpp
// 1.裁剪后面
glEnable(GL_CULL_FACE);
glCullFace(GL_BACK);
float cubeVertices[] = {
    // positions          // texture Coords
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
```

环绕顺序不按照时钟定义，导致面剔除出现错误

![](图片/4.4面剔除/环绕不正确的结果.png)

## 测试2：顶点环绕顺序按照逆时钟定义，开启剔除并且默认逆时针的环绕顺序是正面

按照逆时钟定义，正确的剔除后面

```cpp
// 1.裁剪后面
glEnable(GL_CULL_FACE);
glCullFace(GL_BACK);
float cubeVertices[] = { // 确保三角形是逆时针定义的
    // Back face：背面，从视角看的话是顺时针顺序渲染的，实际上是逆时针定义的
    -0.5f, -0.5f, -0.5f,  0.0f, 0.0f, // Bottom-left
    0.5f,  0.5f, -0.5f,  1.0f, 1.0f, // top-right
    0.5f, -0.5f, -0.5f,  1.0f, 0.0f, // bottom-right         
    0.5f,  0.5f, -0.5f,  1.0f, 1.0f, // top-right
    -0.5f, -0.5f, -0.5f,  0.0f, 0.0f, // bottom-left
    -0.5f,  0.5f, -0.5f,  0.0f, 1.0f, // top-left
    // Front face，正面，从视角看的话是逆时针渲染的，实际上也是逆时针定义的
    -0.5f, -0.5f,  0.5f,  0.0f, 0.0f, // bottom-left
    0.5f, -0.5f,  0.5f,  1.0f, 0.0f, // bottom-right
    0.5f,  0.5f,  0.5f,  1.0f, 1.0f, // top-right
    0.5f,  0.5f,  0.5f,  1.0f, 1.0f, // top-right
    -0.5f,  0.5f,  0.5f,  0.0f, 1.0f, // top-left
    -0.5f, -0.5f,  0.5f,  0.0f, 0.0f, // bottom-left
    // Left face
    -0.5f,  0.5f,  0.5f,  1.0f, 0.0f, // top-right
    -0.5f,  0.5f, -0.5f,  1.0f, 1.0f, // top-left
    -0.5f, -0.5f, -0.5f,  0.0f, 1.0f, // bottom-left
    -0.5f, -0.5f, -0.5f,  0.0f, 1.0f, // bottom-left
    -0.5f, -0.5f,  0.5f,  0.0f, 0.0f, // bottom-right
    -0.5f,  0.5f,  0.5f,  1.0f, 0.0f, // top-right
    // Right face
    0.5f,  0.5f,  0.5f,  1.0f, 0.0f, // top-left
    0.5f, -0.5f, -0.5f,  0.0f, 1.0f, // bottom-right
    0.5f,  0.5f, -0.5f,  1.0f, 1.0f, // top-right         
    0.5f, -0.5f, -0.5f,  0.0f, 1.0f, // bottom-right
    0.5f,  0.5f,  0.5f,  1.0f, 0.0f, // top-left
    0.5f, -0.5f,  0.5f,  0.0f, 0.0f, // bottom-left     
    // Bottom face
    -0.5f, -0.5f, -0.5f,  0.0f, 1.0f, // top-right
    0.5f, -0.5f, -0.5f,  1.0f, 1.0f, // top-left
    0.5f, -0.5f,  0.5f,  1.0f, 0.0f, // bottom-left
    0.5f, -0.5f,  0.5f,  1.0f, 0.0f, // bottom-left
    -0.5f, -0.5f,  0.5f,  0.0f, 0.0f, // bottom-right
    -0.5f, -0.5f, -0.5f,  0.0f, 1.0f, // top-right
    // Top face
    -0.5f,  0.5f, -0.5f,  0.0f, 1.0f, // top-left
    0.5f,  0.5f,  0.5f,  1.0f, 0.0f, // bottom-right
    0.5f,  0.5f, -0.5f,  1.0f, 1.0f, // top-right     
    0.5f,  0.5f,  0.5f,  1.0f, 0.0f, // bottom-right
    -0.5f,  0.5f, -0.5f,  0.0f, 1.0f, // top-left
    -0.5f,  0.5f,  0.5f,  0.0f, 0.0f  // bottom-left        
};
float planeVertices[] = {
    // positions          // texture Coords (note we set these higher than 1 (together with GL_REPEAT as texture wrapping mode). this will cause the floor texture to repeat)
    // 逆时针
    5.0f, -0.5f,  5.0f,  2.0f, 0.0f,// 右下
    5.0f, -0.5f, -5.0f,  2.0f, 2.0f,// 右上
    -5.0f, -0.5f, -5.0f,  0.0f, 2.0f,// 左上

    -5.0f, -0.5f, -5.0f,  0.0f, 2.0f,// 左上
    -5.0f, -0.5f,  5.0f,  0.0f, 0.0f,// 左下
    5.0f, -0.5f,  5.0f,  2.0f, 0.0f,// 右下
};
```

![](图片/4.4面剔除/2.环绕正确的结果-正方形背面不被渲染.png)

可见箱子的背面不被渲染

## 测试3：环绕顺序按照逆时钟定义，开启剔除

- 告诉OpenGL现在改为三角形顶点**顺时针的环绕顺序是正面**

  ```cpp
  glEnable(GL_CULL_FACE);
  glCullFace(GL_BACK);
  glFrontFace(GL_CW);// 顺时针的环绕顺序是正面
  ```

  同样效果的

  ```cpp
  glEnable(GL_CULL_FACE);
  glCullFace(GL_FRONT);
  ```

  三角形顶点使用默认的**逆**时针环绕顺序是**正**面，但剔除正向面

- 效果

  ![](图片/4.4面剔除/测试3-剔除正面.png)




