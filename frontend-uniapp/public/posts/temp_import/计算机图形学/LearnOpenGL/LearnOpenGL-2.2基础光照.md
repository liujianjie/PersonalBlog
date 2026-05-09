# 基础光照

- 简介

  现实世界的光照是极其复杂的，而且会受到诸多因素的影响，这是我们有限的计算能力所无法模拟的。

  OpenGL的光照使用的是**简化的模型**，对现实的情况进行**近似**，这样处理起来会更容易一些

  这些光照模型都是基于我们对光的物理特性的理解，众多模型下有一个模型被称为**冯氏光照模型**(Phong Lighting Model)。

- 冯氏光照模型

  分为

  - 环境光照((Ambient)

    即使在黑暗的情况下，世界上通常也仍然有一些光亮（月亮、远处的光），所以物体几乎永远不会是完全黑暗的

  - 漫反射光照((Diffuse)

    模拟光源对物体的方向性影响(Directional Impact)。它是冯氏光照模型中视觉上最显著的分量

  - 镜面光照((Specular)

    模拟有光泽物体上面出现的**亮点**。

- 图示

  ![](图片/2.2基础光照/basic_lighting_phong.png)

# 环境光照

- 简介

  光通常都不是来自于同一个光源，而是来自于我们周围分散的很多光源，即使它们可能并不是那么显而易见。

  光的一个属性是，它可以向很多方向发散并反弹，从而能够到达不是非常直接临近的点。

  光能够在其它的表面上**反射**，对一个物体产生间接的影响。

  考虑到这种情况的算法叫做**全局照明(Global Illumination)算法**，但是这种算法既开销高昂又极其复杂。

  我们将会先使用一个简化的全局照明模型，即环境光照。

- 如何做

  我们使用一个很小的**常量（光照）颜色**，添加到物体片段的最终颜色中。

  我们用光的颜色**乘以**一个很小的**常量环境因子**，再乘以物体的颜色，然后将最终结果作为片段的颜色：

  ```cpp
  void main(){
      float ambientStrength = 0.1;// 常量环境因子
      vec3 ambient = ambientStrength * lightColor;// 常量（光照）颜色
  
      vec3 result = ambient * objectColor;
      FragColor = vec4(result, 1.0);
  }
  ```
  

![](图片/2.2基础光照/ambient_lighting.png)

# 漫反射光照

漫反射光照使物体上与**光线方向**（不是光照射方向）越接近(越垂直)的片段能从光源处获得更多的亮度

- 图示

  ![](图片/2.2基础光照/diffuse_light.png)

  标注图的光线方向

  ![](图片/2.2基础光照/diffuse_light2.png)

  

- 解释

  **I**是灯泡光源的方向，**-I**是灯泡的光指向的方向。

  **N**是法向量。

- 计算漫反射光照需要什么

  需要光对当前片段的光照强度，这个**光照强度就是漫反射光的强度**。

  **这个强度 = cos夹角 = 余弦值**。

  - 夹角0度，cos夹角 = 1，能从光源处获得全部的亮度
  - 夹角90度，cos夹角= 0，不能从光源处获得全部的亮度 
  - 夹角>90度，cos夹角<0,不能从光源处获得全部的亮度 

- 如何计算这个漫反射光的强度

  - 使用光的方向与N法线的**点积**

    强度 = I与N的点积 = I长度 \* N长度 \* cos角度

    但这不完全正确，I长度和N长度会影响强度（余弦值）

  - 修改

    为了（只）得到两个向量夹角的余弦值(cos角度），使用I和N的单位向量，单位向量的长度为1

    强度 = I与N的点积 = I长度 \* N长度 \* cos角度 = 1 * 1 * cos角度 = cos角度=**余弦值**

  - 所以

    需要确保所有的向量（I、N)都是标准化的

- 计算准备

  - 法向量
  - 光的方向（不是光的照射方向）
    - 片段位置
    - 光的位置

## 法向量

- 简介

  法向量是一个垂直于顶点**表面**的（单位）向量。

- 如何计算顶点的法向量

  由于顶点本身**并没有**表面（它只是空间中一个独立的点），我们利用它周围的顶点来计算出这个顶点的表面，从而才能得到顶点法线。

  我们能够使用一个小技巧，使用**叉乘**对立方体所有的顶点计算法向量。

  但是由于3D立方体不是一个复杂的形状，所以我们可以简单地把法线数据**手工添加**到顶点数据中

- glsl要接受顶点的法线

  ```cpp
  #version 330 core
  layout (location = 0) in vec3 aPos;
  layout (location = 1) in vec3 aNormal;
  
  out vec3 Normal;// 传给片段着色器
  
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);
      Normal = aNormal;
  }
  ```

  更新物体顶点数组的顶点属性指针

  ```cpp
  // 顶点位置
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  // 法线
  glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)(3*sizeof(float)));// 法线位置记得偏移
  glEnableVertexAttribArray(1);
  ```
  
  更新光源顶点数组的顶点属性指针
  
  ```cpp
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  // 变为
  glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 6 * sizeof(float), (void*)0);
  glEnableVertexAttribArray(0);
  ```
  
- glsl 顶点着色器接收法线后要传到片段着色器中

  所有光照的计算都是在片段着色器里进行，因为在片段着色器，由一开始的顶点围成的区域范围内的每一个片段都会通过插值得到自己的坐标和法线。

  ```cpp
  in vec3 Normal;
  ```

## 计算漫反射光照

- 要做的操作

  - 片段着色器定义uniform

    接收光源的位置向量

    ```cpp
    uniform vec3 lightPos;
    ```

    ```cpp
    lightingShader.setVec3("lightPos", lightPos);// 若放渲染循环外面，得记得lightingShader.use();，而我就忘记了
    ```

- 将顶点坐标移到世界空间

  在世界空间中进行所有的光照计算，因此我们需要一个在世界空间中的顶点位置

  如何做：

  在顶点着色器内

  把顶点位置乘以**模型矩阵**（不是观察和投影矩阵）来把它变换到世界空间坐标，这样顶点位置在世界空间，而片段会经过**插值**从而也在世界空间！

  ```cpp
  out vec3 FragPos;  
  out vec3 Normal;
  
  void main()
  {
      gl_Position = projection * view * model * vec4(aPos, 1.0);
      FragPos = vec3(model * vec4(aPos, 1.0));
      Normal = aNormal;// 为什么法线向量不转为世界空间，下面有讲
  }
  ```

  片段着色器接受

  ```
  in vec3 FragPos;
  ```

- 在片段着色器开始计算

  - 光的方向

    ```
    vec3 lightDir = normalize(lightPos - FragPos);
    ```

    - 标准化得到单位向量

    - 这是光的方向，不是光的照射方向

      光的照射方向为（FragPos - lightPos）

  - 法线

    由顶点着色器传入顶点的法线给片段着色器，片段的法线由插值顶点的法线而得出

    这里只需要标准化

    ```cpp
    vec3 norm = normalize(Normal);
    ```

  > 原文：当计算光照时我们通常不关心一个向量的模长或它的位置，我们只关心它们的**方向**。所以，几乎所有的计算都使用**单位向量**完成，因为这简化了大部分的计算（比如点乘）。所以当进行光照计算时，确保你总是对相关向量进行标准化，来保证它们是真正地单位向量。忘记对向量进行标准化是一个十分常见的错误。

  - **点乘**得到光源对当前片段实际的**漫反射影响**

    ```cpp
    float diff = max(dot(norm, lightDir), 0.0);
    ```

  - 将漫反射影响乘以光的颜色

    ```cpp
    vec3 diffuse = diff * lightColor;// 漫反射分量
    ```

    两个向量之间的角度越大，漫反射分量就会越小,因为cos在0-90度是递减的。

    这里漫反射强度*光照颜色lightColor=vec3(1,1,1)，相乘后是光照颜色各个分量的强度，称为**漫反射分量**

  - 最后的颜色

    ```cpp
    vec3 result = (ambient + diffuse) * objectColor;
    FragColor = vec4(result, 1.0);
    ```
  
  - 效果

    ![](图片/2.2基础光照/basic_lighting_diffuse.png)

## 最后一件事

- 问题引出

  当前片段着色器里的计算都是在**世界空间**坐标中进行，所以将**法向量、顶点位置**从顶点着色器传到了片段着色器，顶点位置使用了model矩阵转为世界空间的坐标，但是法向量**没有转**！

- 如何转法向量为世界空间

  - 不完全正确

    法线乘以一个模型矩阵，模型model矩阵包含平移、旋转、缩放

  - 解释

    - 法向量只是一个方向向量，不能表达空间中的特定位置

    - 法向量没有齐次坐标（顶点位置中的w分量）

      这意味着，**位移**不应该影响到法向量，Model矩阵有位移且乘了法线就不正确

  - 那该如何做

    - 若乘以一个模型矩阵

      我们就要从矩阵中移除位移部分，只选用模型矩阵左上角3×3的矩阵（注意，我们也可以把法向量的w分量设置为0，再乘以4×4矩阵；这同样可以**移除位移部分**）

      对于法向量，我们只希望对它实施缩放和旋转变换，即：只有顶点只发生位移时才可以保持不变。

  - 另外一个问题：不等比缩放

    如果模型矩阵执行了**不等比**缩放，顶点的改变会导致法向量不再垂直于表面了，因此，我们不能用上述这样去除了位移的模型矩阵来变换法向量。

    ![](图片/2.3材质/basic_lighting_normal_transformation.png)

    - 如何解决

      用法线矩阵：「**模型矩阵**左上角3x3部分的逆矩阵的转置矩阵」

    - 代码
    
      ```cpp
      Normal = mat3(transpose(inverse(model))) * aNormal;
      ```
    
      > 矩阵求逆是一项对于着色器开销很大的运算，因为它必须在场景中的每一个顶点上进行，所以应该尽可能地避免在着色器中进行求逆运算。以学习为目的的话这样做还好，但是对于一个高效的应用来说，你最好先在CPU上计算出法线矩阵，再通过uniform把它传递给着色器（就像模型矩阵一样）。
      
    - 经后面发现 2.5节《投光物》
    
      当物体发生旋转的时候，法线也要更新。
    
      即：物体发生旋转后，法线需通过法线矩阵变换才能继续垂直于顶点
      
      ```cpp
      void main()
      {
          gl_Position = projection * view * model * vec4(aPos, 1.0);
          FragPos = vec3(model * vec4(aPos, 1.0));
          Normal = mat3(transpose(inverse(model))) * aNormal;
          TexCoords = aTexCoords;
      }
      ```

# 镜面光照

- 简介

  漫反射光照一样，镜面光照也决定于**光的方向**向量和物体的**法向量**，但是它也决定于**观察方向**。

- 图示

  镜面光照决定于表面的**反射特性**。

  如果我们把物体表面设想为一面镜子，那么镜面光照最强的地方就是我们**看到表面上反射光**的地方

  ![](图片/2.2基础光照/basic_lighting_specular_theory.png)

  要计算时图示向量的方向

  ![](图片/2.2基础光照/basic_lighting_specular_theory cal.png)

- 计算相当于观察者位置，光源对当前片段的**镜面光影响**方式

  - 根据法向量**翻折**入射光的方向来计算反射向量

  - 计算反射向量与**观察方向**的角度差

    它们之间夹角越小，镜面光的作用就越大

    由此产生的效果就是，我们看向在入射光在表面的反射方向时，会看到一点高光。

- 观察向量

  使用观察者的**世界空间位置**和**片段的世界空间位置**来计算它：观察者位置减去片段的位置

- 根据以上思路，镜面光照**分量**为

  镜面光照分量 = 镜面光照**强度**(降低光源高亮白色)\*光源对当前片段的**镜面光影响**\*光源的颜色

- 代码

  ```cpp
  // 观察者位置，放在片段着色器就好
  uniform vec3 viewPos;
  ```

  ```cpp
  lightingShader.setVec3("viewPos", camera.Position);
  ```

  因为摄像机的位置向量，就是在**世界空间**，不需要乘以什么model矩阵！

  ```cpp
  vec3 viewDir = normalize(viewPos - FragPos);// 是观察者方向，不是观察者看向的方向
  vec3 reflectDir = reflect(-lightDir, norm);
  ```

  `lightDir`向量进行了取反，lightDir是光源的方向，-lightDir才是光源照向指向的方向，因为`reflect`函数要求第一个向量是**从**光源指向片段位置的向量

  ```cpp
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);
  vec3 specular = specularStrength * spec * lightColor;
  ```

  32是高光的**反光度**(Shininess)，一个物体的反光度越高，反射光的能力越强，散射得越少，高光范围就会越小。

  ![](图片/2.2基础光照/basic_lighting_specular_shininess.png)

  ```cpp
  // 由上一节2.1颜色所说，光源的颜色（冯氏）与物体的颜色值相乘 = 物体的颜色
  vec3 result = (ambient + diffuse + specular) * objectColor;
  FragColor = vec4(result, 1.0);
  ```

  ![](图片/2.2基础光照/镜面光结果.png)

- 注意

  > 原文：我们选择在世界空间进行光照计算，但是大多数人趋向于更偏向在观察空间进行光照计算。在观察空间计算的优势是，**观察者的位置总是在(0, 0, 0)**，所以你已经零成本地拿到了观察者的位置。然而，若以学习为目的，我认为在世界空间中计算光照更符合直觉。如果你仍然希望在观察空间计算光照的话，你需要将所有相关的向量也用**观察矩阵**进行变换（不要忘记也修改法线矩阵）。
