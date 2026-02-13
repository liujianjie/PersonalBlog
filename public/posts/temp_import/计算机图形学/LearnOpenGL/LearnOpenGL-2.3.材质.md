# 材质

- 引出材质

  如果我们想要在OpenGL中模拟多种类型的物体，我们必须针对每种表面定义不同的材质(Material)属性，而不是像2.2节那样定义一个三维向量决定一个物体的颜色，用材质决定物体的颜色。

- 什么是材质（来自高赞评论）

  - 关于材质的理解

    材质就是对光的反射特性

  - 举个栗子

    比如说：在阳光下，树叶是绿色的，并不是树叶发出了绿色的光，而是树叶吸收了其他颜色的光，反射绿色的光。

    剥离掉树叶这种物质，提取出树叶对光“处理”的特性，这就叫树叶材质。

  - 更详细说明

    一般我们使用 漫反射光、镜面反射光、光泽度等属性，来定义一种材质，其实我不喜欢这样的称呼，我更喜欢称作 漫反射率， 镜面反射率。

    比如：树叶的漫反射率(0.54, 0.89, 0.63), 可以这么理解，
    树叶可以反射光照中: 54%的红色光，89%的绿色光，63%的蓝色光，
    树叶可以吸收光照中: 1-54%的红色光，1-89%的绿色光，1-63%的蓝色光

- 材质组成

  当描述一个表面时，我们可以分别为**三个光照分量**定义一个材质颜色(Material Color)：环境光照(Ambient Lighting)、漫反射光照(Diffuse Lighting)和镜面光照(Specular Lighting)

此节不用高赞评论将材质的分量叫为反射率(当做另一种角度理解就好），而是将材质的分量叫做材质环境光照颜色分量、材质漫反射光照颜色分量、材质镜面光照颜色分量

## 例子1

### 代码相关

- glsl

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec3 Normal;
  in vec3 FragPos;
  
  uniform vec3 lightPos;
  uniform vec3 viewPos;
  uniform vec3 objectColor;
  uniform vec3 lightColor;
  
  struct Material {
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
      float shininess;
  }; 
  
  uniform Material material;
  
  void main(){
      // 环境光
      // float ambientStrength = 0.1;
      //vec3 ambient = ambientStrength * lightColor;
      vec3 ambient = lightColor * material.ambient;           // 环境光照分量
  
      // 漫反射
      vec3 norm = normalize(Normal);
      vec3 lightDir = normalize(lightPos - FragPos);
      float diff = max(dot(norm, lightDir), 0.0);// 得到光源对当前片段实际的漫反射影响
      // vec3 diffuse = diff * lightColor;
      vec3 diffuse = lightColor * diff *  material.diffuse;   // 漫反射光照分量
  
      // 镜面光照
      float specularStrength = 0.5;
      vec3 viewDir = normalize(viewPos - FragPos);            // 是观察者方向，不是观察者看向的方向
      vec3 reflectDir = reflect(-lightDir, norm);
  
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);// 光源对当前片段的镜面光影响
      //vec3 specular = specularStrength * spec * lightColor;
      vec3 specular = lightColor * (spec * material.specular);// 镜面光光照分量
  
      //vec3 result = (ambient + diffuse + specular) * objectColor;
      vec3 result = (ambient + diffuse + specular) ;          // 不用乘以物体颜色，材质已经决定了物体的颜色
      
      FragColor = vec4(result, 1.0);
  }
  ```

  注释掉的是2.2节的基础光照计算冯氏光照模型各个最终分量基本代码，当前代码依旧是以冯氏光照模型。

  让材质颜色分量乘以光源颜色乘以2.2节讨论的相关光照影响，并组成物体的颜色。

  - 解读
    - ambient材质向量定义了在环境光照下这个表面反射的是什么颜色，通常与**表面的颜色相同**
    - diffuse材质向量定义了在漫反射光照下表面的颜色。漫反射颜色（和环境光照一样）也被设置为我们期望的**物体颜色**。
    - specular材质向量设置的是表面上镜面高光的颜色（或者甚至可能反映一个特定表面的颜色）
    - shininess影响镜面高光的散射/半径。

  ```cpp
  lightingShader.setVec3("material.ambient",  1.0f, 0.5f, 0.31f);
  lightingShader.setVec3("material.diffuse",  1.0f, 0.5f, 0.31f);
  lightingShader.setVec3("material.specular", 0.5f, 0.5f, 0.5f);
  lightingShader.setFloat("material.shininess", 32.0f);
  ```

- 效果

  ![](图片/2.3材质/材质光照太强.png)

### 光照太强了

- 原因

  物体过亮的原因是材质的环境光、漫反射和镜面光这三个颜色对任何一个光源都**全力反射**。

  换句话说是：光的颜色太亮了

  glsl中的lightcolor = vec3(1.0)

  ```cpp
  vec3 ambient  = vec3(1.0) * material.ambient;
  vec3 diffuse  = vec3(1.0) * (diff * material.diffuse);
  vec3 specular = vec3(1.0) * (spec * material.specular);
  ```

- 如何解决

  回想上一节，环境光给其增加了一个很低的强度，而这里却没有这个强度，所以我们应该要为**每个光照分量**分别指定一个**强度向量**，来影响环境光、漫反射和镜面光。
  
- 实际代码

  是将光源分为3个光照颜色分量并相关分量降低值，不再是1.0f全白色，用其乘以材质相关光照颜色分量与相关光照影响率（2.2）。

  ```cpp
  struct Light {
      vec3 position;
  
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
  };
  uniform Light light;
  light.ambient = vec3(0.2f, 0.2f, 0.2f);
  vec3 ambient = light.ambient * material.ambient;// 光源环境光颜色分量*材质环境光照颜色分量
  ```

注意：在此节光源的各个分量依旧叫做颜色分量，比如：光源环境光颜色分量、光源漫反射颜色分量。而提到的**强度**只是另一种角度理解。

## 例子2

- 代码

  glsl

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec3 Normal;
  in vec3 FragPos;
  
  uniform vec3 viewPos;
  uniform vec3 objectColor;
  uniform vec3 lightColor;
  
  struct Material {
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
      float shininess;
  }; 
  
  uniform Material material;
  // 光源分为3个光照分量
  struct Light {
      vec3 position;
  
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
  };
  
  uniform Light light;
  void main(){
      // 环境光
      float ambientStrength = 0.1;
      //vec3 ambient = ambientStrength * lightColor;
      //vec3 ambient = lightColor * material.ambient;
      vec3 ambient = light.ambient * material.ambient;            // 环境光照分量
  
      // 漫反射
      vec3 norm = normalize(Normal);
      vec3 lightDir = normalize(light.position - FragPos);
      float diff = max(dot(norm, lightDir), 0.0);                 // 得到光源对当前片段实际的漫反射影响
      // vec3 diffuse = diff * lightColor;
      // vec3 diffuse = lightColor * diff *  material.diffuse;
      vec3 diffuse = light.diffuse * diff *  material.diffuse;    // 漫反射光照分量
  
      // 镜面光照
      float specularStrength = 0.5;
      vec3 viewDir = normalize(viewPos - FragPos);                // 是观察者方向，不是观察者看向的方向
      vec3 reflectDir = reflect(-lightDir, norm);
  
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);// 光源对当前片段的镜面光影响
      //vec3 specular = specularStrength * spec * lightColor;
      //vec3 specular = lightColor * (spec * material.specular);
      vec3 specular = light.specular * (spec * material.specular);// 镜面光光照分量
  
      //vec3 result = (ambient + diffuse + specular) * objectColor;
      vec3 result = (ambient + diffuse + specular);               // 不用乘以物体颜色，材质已经决定了物体的颜色
      
      FragColor = vec4(result, 1.0);
  }
  ```
  
  - 以漫反射光照分量为例
  
    **漫反射光照分量 = 光源漫反射颜色分量 * 材质漫反射光照颜色分量 * 光源对片段的漫反射影响**
  
- 如何正确设置光源的颜色分量
    - 环境光照通常被设置为一个比较**低的强度**，因为我们不希望环境光颜色太过主导
    - 光源的漫反射分量通常被设置为我们希望**光所具有的那个颜色**，通常是一个比较明亮的白色
    - 镜面光分量通常会保持为`vec3(1.0)`，以最大强度发光。
    
    ```cpp
    lightingShader.setVec3("light.ambient",  0.2f, 0.2f, 0.2f);
    lightingShader.setVec3("light.diffuse",  0.5f, 0.5f, 0.5f); // 将光照调暗了一些以搭配场景
    lightingShader.setVec3("light.specular", 1.0f, 1.0f, 1.0f); 
    ```
    
- 效果

    ![](图片/2.3材质/材质光照正常.png)

## 例子3: 不同的光源颜色

- 这里优化代码

  随着时间更改光源分量颜色，从而导致物体在变色一样

  ```cpp
  glm::vec3 lightColor;
  lightColor.x = sin(glfwGetTime() * 2.0f);
  lightColor.y = sin(glfwGetTime() * 0.7f);
  lightColor.z = sin(glfwGetTime() * 1.3f);
  
  glm::vec3 diffuseColor = lightColor   * glm::vec3(0.5f); // 降低影响
  glm::vec3 ambientColor = diffuseColor * glm::vec3(0.2f); // 很低的影响
  
  lightingShader.setVec3("light.ambient", ambientColor);// 设置光源环境光颜色分量
  lightingShader.setVec3("light.diffuse", diffuseColor);// 设置光源漫反射颜色分量
  lightingShader.setVec3("light.specular", 1.0f, 1.0f, 1.0f);
  ```
  
- 效果

  ![](图片/2.3材质/例子3不同颜色.png)
