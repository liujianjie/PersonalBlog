# 投光物

- 前面几节使用的光照都来自于空间中的一个点

  即把光源当做一个点

  但现实世界中，我们有很多种类的光照，每种的表现都不同。

- 投光物

  将光**投射**(Cast)到物体的光源叫做**投光物**
  
- 小结

  我做个小总结，与前面几节把光源当做一个点的区别

  - 平行光

    - 与一个点做光源不一样

      点光源需要位置

      平行光需要方向

      所以在实现计算光源对片段的漫反射、镜面光影响，要得到光源的方向方式会**不一样**

  - 点光源

    - 与一个点做光源一样需要位置

      在实现计算光源对片段的漫反射、镜面光影响，要得到光源的方向方式会**一样**

    - 点光源会衰减，前面的点光不会

  - 聚光灯

    - 与一个点做光源一样需要位置

      在实现计算光源对片段的漫反射、镜面光影响，要得到光源的方向方式会**一样**

    - 聚光灯照射一个特点方向的范围，前面的点光没有范围且四周散射

# 平行光

这里需要定义平行光的方向**向下**，才符合太阳的光照照射（指向）方向，所以计算漫反射和镜面光强度的时候需要**取反**得到光源的方向向量。

- 简介

  当我们使用一个假设光源处于**无限**远处的模型时，它就被称为**定向光**，因为它的所有光线都有着**相同**的方向，它与**光源的位置是没有关系**的。

- 图示

  ![](图片/2.4光照贴图/light_casters_directional.png)

  计算漫反射和镜面光分量时光源的方向

  ![](图片/2.4光照贴图/light_casters_directional -update.png)

- 特点

  因为所有的光线都是平行的，所以物体与光源的相对位置是不重要的，因为对场景中每一个物体光的方向都是一致的。

- 例子

  定义一个光线**方向**向量**而不是位置**向量来模拟一个定向光。

  这个光线方向是从光源指向像素点的方向，若要模仿太阳光从上往下照射，各个分量值应该为**负**的

  cpp

  ```cpp
  lightingShader.setVec3("light.direction", -0.2f, -1.0f, -0.3f);// 太阳光向下
  ```

  glsl

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec3 Normal;
  in vec3 FragPos;
  in vec2 TexCoords;// 纹理坐标
  
  uniform vec3 viewPos;
  
  struct Material {
      sampler2D diffuse;  // 纹理单元
      sampler2D specular;//  镜面光照颜色分量从纹理采样
      float shininess;
  }; 
  uniform Material material;
  
  // 光照强度
  struct Light {
      // vec3 position; // 使用平行光就不再需要位置了
      vec3 direction; // 从光源出发到全局的方向
  
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
  };
  
  uniform Light light;
  void main()
  {
      // 取负变为光源的方向向量，用在计算漫反射和镜面光分量时
      vec3 lightDir = normalize(-light.direction);
      // 环境光光照分量
      float ambientStrength = 0.1;
      // 从漫反射纹理读取颜色分量
      vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords)); 
  
      // 漫反射光照分量
      vec3 norm = normalize(Normal);
      // vec3 lightDir = normalize(light.position - FragPos);// 一个点做光源才需要这样相减计算片段到光源的方向向量
      float diff = max(dot(norm, lightDir), 0.0);             // 得到光源对当前片段实际的漫反射影响
      vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));// 从漫反射纹理读取颜色分量
  
      // 镜面光照分量
      float specularStrength = 0.5;
      vec3 viewDir = normalize(viewPos - FragPos);            // 是观察者方向，不是观察者看向的方向
      vec3 reflectDir = reflect(-lightDir, norm);
  
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);// 光源对当前片段的镜面光影响
      // vec3 specular = light.specular * (spec * material.specular); // 改变在这里
      // 采样镜面光纹理颜色作为镜面光照颜色分量
      vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords)); 
  
      vec3 result = (ambient + diffuse + specular) ;
      
      FragColor = vec4(result, 1.0);
  }
  ```

  - 说明

    依旧是冯氏光照模型
  
    vec3 lightDir = normalize(-light.direction);
  
    因为direction是光源指向像素点，加了负号以后**成为像素点指向光源**（光源的方向），这样才能与前面小节相符，正确计算光源对片段的漫反射和镜面光影响。
  
    （对应开头的小结：在实现计算光源对片段的漫反射、镜面光影响，要得到光源的方向方式会**不一样**）
  
    ```cpp
    // vec3 lightDir = normalize(light.position - FragPos);// 一个点做光源才需要这样相减计算片段到光源的方向向量
    // 取负变为光源的方向向量，用在计算漫反射和镜面光分量时
    vec3 lightDir = normalize(-light.direction);
    float diff = max(dot(norm, lightDir), 0.0);             // 得到光源对当前片段实际的漫反射影响
    ```
  
  ![](图片/2.5投光物/平行光.png)

# 点光源

这里算距离与衰减，无论是光源的方向还是光源的指向方向都可以，但是计算漫反射和镜面光强度还是依旧用光的方向向量。

- 介绍

  处于世界中某一个位置的光源，它会朝着所有方向发光，但光线会随着**距离**逐渐**衰减**

- 图

  ![](图片/2.5投光物/light_casters_point.png)
  
  计算漫反射和镜面光分量时光源的方向图就不用画了，就是片段指向灯泡
  
- 重点在于如何定义衰减，即距离与衰减系数关系

  - 若用线性
  
    - 距离的增长线性地减少光的强度，从而让远处的物体更暗
  
    - 这样的线性方程通常会看起来比较**假**
  
  - 用以下公式才是**稍好的**选择
  
    ![](图片/2.5投光物/衰减公式.png)
  
    定义3个（可配置的）项：常数项**Kc**、一次项**Kl**和二次项Kq。
  
    - 解读
  
      - 常数项Kc通常保持为1.0，它的主要作用是保证分母永远不会比1小，否则的话在某些距离上它反而会增加强度，这肯定不是我们想要的效果。
    
      - 一次项Kl会与距离值相乘，以线性的方式减少强度。
  
      - 二次项Kq会与距离的平方相乘，让光源以二次递减的方式减少强度。
  
        二次项在距离比较小的时候影响会比一次项小很多，但当距离值比较大的时候它就会比一次项更大了。
  
    - 效果
  
      ![](图片/2.5投光物/attenuation.png)
  
      光在近距离时亮度很高、随着距离变远亮度迅速降低、最后会以更慢的速度减少亮度
  
      **匹配**
  
      现实：灯在近处通常会非常亮、随着距离的增加光源的亮度一开始会下降**非常快**、但在远处时剩余的光强度就会下降的**非常缓慢**
    
    - 选择正确的值
    
      | 距离 | 常数项 | 一次项 | 二次项   |
      | :--- | :----- | :----- | :------- |
      | 7    | 1.0    | 0.7    | 1.8      |
      | 13   | 1.0    | 0.35   | 0.44     |
      | 20   | 1.0    | 0.22   | 0.20     |
      | 32   | 1.0    | 0.14   | 0.07     |
      | 50   | 1.0    | 0.09   | 0.032    |
      | 65   | 1.0    | 0.07   | 0.017    |
      | 100  | 1.0    | 0.045  | 0.0075   |
      | 160  | 1.0    | 0.027  | 0.0028   |
      | 200  | 1.0    | 0.022  | 0.0019   |
      | 325  | 1.0    | 0.014  | 0.0007   |
      | 600  | 1.0    | 0.007  | 0.0002   |
      | 3250 | 1.0    | 0.0014 | 0.000007 |
  
- 例子

  - glsl
  
    ```cpp
    #version 330 core
    out vec4 FragColor;
    struct Material {
        sampler2D diffuse;  // 纹理单元
        sampler2D specular;//  镜面光照颜色分量从纹理采样
        float shininess;
    }; 
    // 点光源
    struct Light {
        vec3 position;  // 需要位置
    
        vec3 ambient;   
        vec3 diffuse;
        vec3 specular;
    
        float constant; // 常数
        float linear;   // 一次项
        float quadratic;// 二次项
    };
    
    in vec3 FragPos;
    in vec3 Normal;
    in vec2 TexCoords;// 纹理坐标
    
    uniform vec3 viewPos;
    uniform Material material;
    uniform Light light;
    void main()
    {
        // 环境光光照分量
        // 从漫反射纹理读取颜色分量
        vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords)); 
    
        // 漫反射光照分量
        vec3 norm = normalize(Normal);
        vec3 lightDir = normalize(light.position - FragPos); // 得到光源的方向,与一个点做光源一样
        float diff = max(dot(norm, lightDir), 0.0);         // 得到光源对当前片段实际的漫反射影响
        vec3 diffuse = light.diffuse * diff * texture(material.diffuse, TexCoords).rgb;// 从漫反射纹理读取颜色分量
    
        // 镜面光照分量
        vec3 viewDir = normalize(viewPos - FragPos);        // 是观察者方向，不是观察者看向的方向
        vec3 reflectDir = reflect(-lightDir, norm);         // reflect要求第一个参数是光源指向像素点的向量
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);// 光源对当前片段的镜面光影响
        // 采样镜面光纹理颜色作为镜面光照颜色分量
        //vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords)); // 这句也行
        vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb; 
    
        // 计算衰减
        float distance  = length(light.position - FragPos);                // 得到光源到片段长度
        float attenuation = 1.0 / (light.constant + light.linear * distance // 根据公式
                            + light.quadratic * distance * distance);
        
        // 光照分量随距离衰减
        ambient *= attenuation;
        diffuse *= attenuation;
        specular *= attenuation;
    
        vec3 result = (ambient + diffuse + specular) ;
        
        FragColor = vec4(result, 1.0);
    }
    ```
  
    - 说明
  
      与一个点做光源一样，用光源的位置减去片段位置得到光源的方向
  
      ```cpp
      vec3 lightDir = normalize(light.position - FragPos); // 得到光源的方向,与一个点做光源一样
      ```
  
    cpp
  
    ```cpp
    lightingShader.setFloat("light.constant",  1.0f);
    lightingShader.setFloat("light.linear",    0.09f);
    lightingShader.setFloat("light.quadratic", 0.032f);
    ```
  
  - 重要bug
  
    箱子发生旋转，法线也要跟随着变换，不然法线不再垂直顶点，会导致如下不正确效果
  
    ![](图片/2.5投光物/点光源bug.png)
  
    所以需要在vs阶段需计算发生变换后的法线
  
    ```cpp
    #version 330 core
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aNormal;
    layout (location = 2) in vec2 aTexCoords;
    
    uniform mat4 view;
    uniform mat4 projection;
    uniform mat4 model;
    
    out vec3 FragPos;  
    out vec3 Normal;
    out vec2 TexCoords;
    void main()
    {
        gl_Position = projection * view * model * vec4(aPos, 1.0);
        FragPos = vec3(model * vec4(aPos, 1.0));
        // Normal = aNormal;// 只有顶点只发生位移时才可以保持不变
        Normal = mat3(transpose(inverse(model))) * aNormal;
        TexCoords = aTexCoords;
    }
    ```
    
    以下正确结果
    
    ![](图片/2.5投光物/点光源.png)

# 聚光

这里定义光源的位置为摄像机的位置向量，计算漫反射和镜面光反射，得摄像机的位置减去像素点的位置就成光的方向向量。

- 简介

  位于环境中某个位置的光源，它只朝**一个特定方向**而不是所有方向照射光线。

  这样的结果就是只有在聚光方向的特定**半径内**的物体才会被照亮，其它的物体都会保持黑暗。

  聚光很好的例子就是路灯或手电筒

- opengl上表示

  OpenGL中聚光是用一个世界空间位置、一个方向和一个**切光角**来表示，切光角指定了聚光的半径

- 实现思路

  对于每个片段，我们会计算片段**是否**位于聚光的切光方向之间（也就是在锥形内），如果是的话，我们就会相应地照亮片段

- 图示

  ![](图片/2.5投光物/light_casters_spotlight_angles.png)

  - `LightDir`：从片段指向光源的向量。
  - `SpotDir`：聚光所指向的方向。（但实际计算时，取反方向）
  - `Phi`ϕ：指定了聚光半径的切光角。落在这个角度之外的物体都不会被这个聚光所照亮。
  - `Theta`θ：LightDir向量和SpotDir向量之间的夹角。在聚光内部的话θ值应该比ϕ值小。

  要做的就是计算LightDir向量和SpotDir向量之间的**点积**，等于cosθ值，将cosθ值与切光角cosϕ值对比

## 不平滑的例子

- 计算向量图示

  ![](图片/2.5投光物/light_casters_spotlight_angles-实际计算.png)

  

  算theta时，为了与光的方向向量对应，dot(光的方向向量，取反光源照射前方向量)

- 代码

  ```cpp
  #version 330 core
  out vec4 FragColor;
  struct Material {
      sampler2D diffuse;  // 漫反射颜色分量从纹理采样
      sampler2D specular;//  镜面光照颜色分量从纹理采样
      float shininess;
  }; 
  // 聚光灯
  struct Light {
      vec3  position; // 需要位置
      vec3  direction;// 需要照射方向
      float cutOff;
  
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
      float constant; // 常数
      float linear;   // 一次项
      float quadratic;// 二次项
  };
  
  in vec3 FragPos;
  in vec3 Normal;
  in vec2 TexCoords;// 纹理坐标
  
  uniform vec3 viewPos;
  uniform Material material;
  uniform Light light;
  void main()
  {
      // 光源的方向向量：像素点指向光源
      vec3 lightDir = normalize(light.position - FragPos);
      // 算出theta，dot(像素点指向光源，光源照射的方向取反）
      float theta = dot(lightDir, normalize(-light.direction)); 
      // float theta=dot(-lightDir, normalize(light.direction));// dot(光源指向像素点, 光源照射的方向)
      // 执行正常光照计算：由于theta是cos值，cutOff也是cos值，cos(0-90)递减，所以theta>，而不是<
      if(theta > light.cutOff){
          // 片段在切角内
          // 从漫反射纹理读取颜色分量
          vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords)); 
  
          // 漫反射光照分量
          vec3 norm = normalize(Normal);
          vec3 lightDir = normalize(light.position - FragPos); // 得到光源的方向,与一个点做光源一样
          float diff = max(dot(norm, lightDir), 0.0);         // 得到光源对当前片段实际的漫反射影响
          vec3 diffuse = light.diffuse * diff * texture(material.diffuse, TexCoords).rgb;// 从漫反射纹理读取颜色分量
  
          // 镜面光照分量
          vec3 viewDir = normalize(viewPos - FragPos);       // 是观察者方向，不是观察者看向的方向
          vec3 reflectDir = reflect(-lightDir, norm);         // reflect要求第一个参数是光源指向像素点的向量
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);// 光源对当前片段的镜面光影响
          // 采样镜面光纹理颜色作为镜面光照颜色分量
          //vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords)); // 这句也行
          vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb; 
  
          // 计算衰减
          float distance  = length(light.position - FragPos);                 // 得到光源到片段长度
          float attenuation = 1.0 / (light.constant + light.linear * distance // 根据公式
                              + light.quadratic * distance * distance);
      
          // 光照分量随距离衰减
          ambient *= attenuation;
          diffuse *= attenuation;
          specular *= attenuation;
  
          vec3 result = (ambient + diffuse + specular) ;
      
          FragColor = vec4(result, 1.0);
      }else{
          // 片段不在切角内：计算环境光，以免全黑
          FragColor = vec4(light.ambient * vec3(texture(material.diffuse, TexCoords)), 1.0) ;
      }
  }
  ```

  上传数据

  ```cpp
  lightingShader.setVec3("light.position",  camera.Position);
  lightingShader.setVec3("light.direction", camera.Front);
  lightingShader.setFloat("light.cutOff",   glm::cos(glm::radians(12.5f)));
  ```

  - 说明

    算theta时，为了与光的方向向量对应，dot(像素点指向光源，光源照射的方向取反）

    ```cpp
    float theta = dot(lightDir, normalize(-light.direction)); 
    ```

    与一个点做光源一样，用光源的位置减去片段位置得到光源的方向

    ```cpp
    vec3 lightDir = normalize(light.position - FragPos); // 得到光源的方向,与一个点做光源一样
    ```

  - 注意点theta > light.cutOff

    因为上传给cutOff的是已经计算好了的cos值，且theta也是cosθ值（cosθ=dot(lightDir, normalize(-light.direction)))

    cos(0-90内)递减，所以theta >light.cutOff，代表当前夹角要比规定的范围角度**要小**，需要照亮

    ![](图片/2.5投光物/light_casters_cos.png)

- 效果

  ![](图片/2.5投光物/聚光灯.png)

  - 疑问点

    为什么，计算cos角度要用弧度值

    ```cpp
    lightingShader.setFloat("light.cutOff", glm::cos(glm::radians(12.5f)));
    ```

    glm::cos()；接收的参数需要是弧度值

- 测试点积两个向量的方向

  ```cpp
  glm::vec3 lightDir = camera.Position;
  glm::vec3 lightdirection = camera.Front;
  float theta1 = glm::dot(lightDir, glm::normalize(-lightdirection));// 对应第一个图
  cout << "像素点指向光源：" << theta1 << endl;
  float theta2 = glm::dot(-lightDir, glm::normalize(lightdirection));// 对应第二个图
  cout << "光源指向像素点：" << theta2 << endl;
  ```

  

  ![](图片/2.5投光物/点积负方向.png)

  ![](图片/2.5投光物/点积正方向.png)

  ![](图片/2.5投光物/验证点击效果.png)

  方向一样，点积值一样

## 平滑例子

- 引入

  如上一个例子，发现聚光灯的光圈边缘并不平滑

- 解决方法

  我们可以将内圆锥设置为上一个例子聚光灯的圆锥，但我们也需要一个**外圆锥**，来让光从内圆锥逐渐减暗，直到外圆锥的边界。

- 融入代码中

  为了创建一个外圆锥，我们只需要再定义一个**余弦值**来代表聚光灯方向向量和外圆锥向量（等于它的半径）的**夹角**

- 边缘平滑且圆锥内正常思路

  如果一个片段处于内外圆锥之间，将会给它计算出一个0.0到1.0之间的强度值。

  如果片段在内圆锥之内，它的强度就是1.0。

  如果在外圆锥之外强度值就是0.0。

- 公式来计算边缘平滑且圆锥内正常

  ![](图片/2.5投光物/聚光灯光圈平滑公式.png)

  - 理解方式一

    θ = dot(像素点指向光源，光源照射的方向取反）= cos(它们之间的夹角)

    γ =  cos（外圆角度）

    ϵ(Epsilon) = cos(内圆角度) **-** cos（外圆角度）

  - 结合下方图表理解

    θ = cos（θ（角度） = dot(像素点指向光源，光源照射的方向取反）= cos(它们之间的夹角)

    γ = cos（γ（角度））=   γ（外光切）

    ϵ(Epsilon) = ϕ（内光切）**-**   γ（外光切）

  | θ     | θ（角度） | ϕ（内光切） | ϕ（角度） | γ（外光切） | γ（角度） | ϵ                       | I                             |
  | :---- | :-------- | :---------- | :-------- | :---------- | :-------- | :---------------------- | :---------------------------- |
  | 0.87  | 30        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.87 - 0.82 / 0.09 = 0.56     |
  | 0.9   | 26        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.9 - 0.82 / 0.09 = 0.89      |
  | 0.97  | 14        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.97 - 0.82 / 0.09 = 1.67     |
  | 0.83  | 34        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.83 - 0.82 / 0.09 = 0.11     |
  | 0.64  | 50        | 0.91        | 25        | 0.82        | 35        | 0.91 - 0.82 = 0.09      | 0.64 - 0.82 / 0.09 = -2.0     |
  | 0.966 | 15        | 0.9978      | 12.5      | 0.953       | 17.5      | 0.9978 - 0.953 = 0.0448 | 0.966 - 0.953 / 0.0448 = 0.29 |

  - 个人发现图表有错（也许没错）

    最后一行：cos值计算错了

    **cos（12.5）=0.976**，而表中的0.9978是cos(12.5rad)，把12.5当做弧度来计算cos值

- 转换为代码

  glsl

  ```cpp
  #version 330 core
  out vec4 FragColor;
  struct Material {
      sampler2D diffuse;  // 漫反射颜色分量从纹理采样
      sampler2D specular;//  镜面光照颜色分量从纹理采样
      float shininess;
  }; 
  // 聚光灯
  struct Light {
      vec3  position; // 需要位置
      vec3  direction;// 需要照射方向
      float cutOff;	// ϕ（内光切）
      float outerCutOff;// γ（外光切）
  
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
      float constant; // 常数
      float linear;   // 一次项
      float quadratic;// 二次项
  };
  in vec3 FragPos;
  in vec3 Normal;
  in vec2 TexCoords;// 纹理坐标
  
  uniform vec3 viewPos;
  uniform Material material;
  uniform Light light;
  void main()
  {
      // 光源的方向向量：像素点指向光源
      vec3 lightDir = normalize(light.position - FragPos);
      // 算出theta，dot(像素点指向光源，光源照射的方向取反）
      float theta = dot(lightDir, normalize(-light.direction));
      // float theta=dot(-lightDir, normalize(light.direction));// dot(光源指向像素点, 光源照射的方向)
  
      
  
      // 从漫反射纹理读取颜色分量
      vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords)); 
  
      // 漫反射光照分量
      vec3 norm = normalize(Normal);
      // vec3 lightDir = normalize(light.position - FragPos); // 得到光源的方向
      float diff = max(dot(norm, lightDir), 0.0);
      vec3 diffuse = light.diffuse * diff * texture(material.diffuse, TexCoords).rgb;// 从漫反射纹理读取颜色分量
  
       // 镜面光照分量
      vec3 viewDir = normalize(viewPos - FragPos);            // 是观察者方向，不是观察者看向的方向
      vec3 reflectDir = reflect(-lightDir, norm);             // reflect要求第一个参数是光源指向像素点的向量
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);// 光源对当前片段的镜面光影响
      // 采样镜面光纹理颜色作为镜面光照颜色分量
      //vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords)); // 这句也行
      vec3 specular = light.specular * spec * texture(material.specular, TexCoords).rgb; 
  
      // 计算衰减
      float distance  = length(light.position - FragPos);                 // 得到光源到片段长度
      float attenuation = 1.0 / (light.constant + light.linear * distance // 根据公式
                          + light.quadratic * distance * distance);
      
      // 光照分量随距离衰减
      ambient *= attenuation;
      diffuse *= attenuation;
      specular *= attenuation;
  
      // 为了边缘平滑且圆锥内正常
      float epsilon = light.cutOff - light.outerCutOff;
      float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);
  
      // 将不对环境光做出影响，让它总是能有一点光
      diffuse *= intensity;
      specular *= intensity;// 聚光灯受影响
  
      vec3 result = (ambient + diffuse + specular) ;
      
      FragColor = vec4(result, 1.0);
  }
  ```

  ```cpp
  lightingShader.use();
  lightingShader.setVec3("viewPos", camera.Position);
  lightingShader.setVec3("light.position", camera.Position);
  lightingShader.setVec3("light.direction", camera.Front);// direction是光照射方向
  lightingShader.setFloat("light.cutOff", glm::cos(glm::radians(12.5f)));		//ϕ（内光切）
  lightingShader.setFloat("light.outerCutOff", glm::cos(glm::radians(17.5f)));// γ（外光切）
  ```

- 效果

  ![](图片/2.5投光物/聚光灯平滑的过渡.png)


