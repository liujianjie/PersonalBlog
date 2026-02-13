# 前言

- 此节目的

  综合2.5投光物，在此节实现一个场景使用多个光源，物体根据不同光源而**叠加颜色**。

  - 熟悉多光源如何计算物体颜色
  - 熟悉用glsl函数

# 例子

## 代码

- glsl

  ```cpp
  #version 330 core
  out vec4 FragColor;
  struct Material {
      sampler2D diffuse;  // 漫反射颜色分量从纹理采样
      sampler2D specular;//  镜面光照颜色分量从纹理采样
      float shininess;
  }; 
  // 平行光
  struct DirLight  {
      vec3 direction; // 从光源出发到全局的方向
  
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
  };
  // 点光源
  struct PointLight  {
      vec3 position;  
  
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
  
      float constant; // 常数
      float linear;   // 一次项
      float quadratic;// 二次项
  };
  
  uniform DirLight dirLight;
  #define NR_POINT_LIGHTS 4
  uniform PointLight pointLights[NR_POINT_LIGHTS];
  
  uniform Material material;
  
  in vec3 FragPos;
  in vec3 Normal;
  in vec2 TexCoords;// 纹理坐标
  
  uniform vec3 viewPos;
  
  // 计算平行光影响当前片段的颜色
  vec3 CalcDirLight(DirLight light, vec3 normal, vec3 viewDir){
      vec3 lightDir = normalize(-light.direction);// 取负变为光源的方向向量，用在计算漫反射和镜面光分量时
      // 漫反射光照分量
      float diff = max(dot(normal, lightDir), 0.0);// 得到光源对当前片段实际的漫反射影响
      // 镜面光光照分量
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
      // 从纹理读取颜色分量
      vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords));
      vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));
      vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));
      return (ambient + diffuse + specular);
  }
  // 计算点光源影响当前片段的颜色
  vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir){
      vec3 lightDir = normalize(light.position - fragPos);
      // 漫反射光照分量
      float diff = max(dot(normal, lightDir), 0.0);// 得到光源对当前片段实际的漫反射影响
      // 镜面光光照分量
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
      // 衰减系数
      float distance = length(light.position - fragPos);
      float attenuation = 1.0 / (light.constant + light.linear * distance +
                          light.quadratic * distance * distance);
      // 从纹理读取颜色分量
      vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords));
      vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));
      vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));
      // 衰减后
      ambient *= attenuation;
      diffuse *= attenuation;
      specular *= attenuation;
      return (ambient + diffuse + specular);
  }
  void main()
  {
      // 属性
      vec3 norm = normalize(Normal);
      vec3 viewDir = normalize(viewPos - FragPos);
  
      // 平行光
      vec3 result = CalcDirLight(dirLight, norm, viewDir);
  
      // 点光源
      for(int i = 0; i < NR_POINT_LIGHTS; i++){
          result += CalcPointLight(pointLights[i], norm, FragPos, viewDir);
      }
      
      FragColor = vec4(result, 1.0);
  }
  ```
  
- cpp

  ```cpp
  lightingShader.use();
  lightingShader.setInt("material.diffuse", 0);
  lightingShader.setInt("material.specular", 1);
  lightingShader.setFloat("material.shininess", 32.0f);
  // 平行光
  lightingShader.setVec3("dirLight.direction", -0.2f, -1.0f, -0.3f);
  lightingShader.setVec3("dirLight.ambient", 0.05f, 0.05f, 0.05f);
  lightingShader.setVec3("dirLight.diffuse", 0.4f, 0.4f, 0.4f);
  lightingShader.setVec3("dirLight.specular", 0.5f, 0.5f, 0.5f);
  
  // 点光源
  lightingShader.setVec3("pointLights[0].position", pointLightPositions[0]);
  lightingShader.setVec3("pointLights[0].ambient", 0.05f, 0.05f, 0.05f);
  lightingShader.setVec3("pointLights[0].diffuse", 0.8f, 0.8f, 0.8f);
  lightingShader.setVec3("pointLights[0].specular", 1.0f, 1.0f, 1.0f);
  lightingShader.setFloat("pointLights[0].constant", 1.0f);
  lightingShader.setFloat("pointLights[0].linear", 0.09f);
  lightingShader.setFloat("pointLights[0].quadratic", 0.032f);
  
  lightingShader.setVec3("pointLights[1].position", pointLightPositions[1]);
  lightingShader.setVec3("pointLights[1].ambient", 0.05f, 0.05f, 0.05f);
  lightingShader.setVec3("pointLights[1].diffuse", 0.8f, 0.8f, 0.8f);
  lightingShader.setVec3("pointLights[1].specular", 1.0f, 1.0f, 1.0f);
  lightingShader.setFloat("pointLights[1].constant", 1.0f);
  lightingShader.setFloat("pointLights[1].linear", 0.09f);
  lightingShader.setFloat("pointLights[1].quadratic", 0.032f);
  
  lightingShader.setVec3("pointLights[2].position", pointLightPositions[2]);
  lightingShader.setVec3("pointLights[2].ambient", 0.05f, 0.05f, 0.05f);
  lightingShader.setVec3("pointLights[2].diffuse", 0.8f, 0.8f, 0.8f);
  lightingShader.setVec3("pointLights[2].specular", 1.0f, 1.0f, 1.0f);
  lightingShader.setFloat("pointLights[2].constant", 1.0f);
  lightingShader.setFloat("pointLights[2].linear", 0.09f);
  lightingShader.setFloat("pointLights[2].quadratic", 0.032f);
  
  lightingShader.setVec3("pointLights[3].position", pointLightPositions[3]);
  lightingShader.setVec3("pointLights[3].ambient", 0.05f, 0.05f, 0.05f);
  lightingShader.setVec3("pointLights[3].diffuse", 0.8f, 0.8f, 0.8f);
  lightingShader.setVec3("pointLights[3].specular", 1.0f, 1.0f, 1.0f);
  lightingShader.setFloat("pointLights[3].constant", 1.0f);
  lightingShader.setFloat("pointLights[3].linear", 0.09f);
  lightingShader.setFloat("pointLights[3].quadratic", 0.032f);
  // -----------
  while (!glfwWindowShouldClose(window))
  {
      // view/projection transformations
      glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
      glm::mat4 view = camera.GetViewMatrix();
      lightingShader.setMat4("projection", projection);
      lightingShader.setMat4("view", view);
      // 绑定漫反射贴图-出过错，放在绘制光源cube那里
      glActiveTexture(GL_TEXTURE0);
      glBindTexture(GL_TEXTURE_2D, texture1);
      glActiveTexture(GL_TEXTURE1);
      glBindTexture(GL_TEXTURE_2D, texture2);
      glActiveTexture(GL_TEXTURE2);
      glBindTexture(GL_TEXTURE_2D, texture3);
  
      glBindVertexArray(cubeVAO);
      for (unsigned int i = 0; i < 10; i++)
      {
          glm::mat4 model = glm::mat4(1.0f);
          model = glm::translate(model, cubePositions[i]);
          float angle = 20.0f * i;
          model = glm::rotate(model, glm::radians(angle), glm::vec3(1.0f, 0.3f, 0.5f));
          lightingShader.setMat4("model", model);
  
          glDrawArrays(GL_TRIANGLES, 0, 36);
      }
      // 绘画灯
      // world transformation
      glm::mat4 model;
  
      lightCubeShader.use();
      lightCubeShader.setMat4("projection", projection);
      lightCubeShader.setMat4("view", view);
      glBindVertexArray(cubeVAO);
      for (unsigned int i = 0; i < 4; i++) {
          model = glm::mat4(1.0f);
          model = glm::translate(model, pointLightPositions[i]);
          model = glm::scale(model, glm::vec3(0.2f));
          lightCubeShader.setMat4("model", model);
          glDrawArrays(GL_TRIANGLES, 0, 36);
      }
      glfwSwapBuffers(window);
      glfwPollEvents();
  ```
  
- 关键代码

  glsl

  ```cpp
  #define NR_POINT_LIGHTS 4
  uniform PointLight pointLights[NR_POINT_LIGHTS];
  ```

  cpp

  ```cpp
  lightingShader.setVec3("pointLights[1].position", pointLightPositions[1]);
  lightingShader.setVec3("pointLights[1].ambient", 0.05f, 0.05f, 0.05f);
  ```

## 没有聚光灯效果

![](图片/2.6多光源/效果.png)

## 有聚光灯效果

- 修改代码

  glsl

  ```cpp
  .....
  struct Material {
      sampler2D diffuse;  // 漫反射颜色分量从纹理采样
      sampler2D specular;//  镜面光照颜色分量从纹理采样
      sampler2D spotLightDiffuse;//  聚光灯的漫反射颜色分量从纹理采样
      float shininess;
  }; 
  .....
  uniform SpotLight spotLight;
      // 计算点光源影响当前片段的颜色
  vec3 CalcPointLight(PointLight light, vec3 normal, vec3 fragPos, vec3 viewDir){
      vec3 lightDir = normalize(light.position - fragPos);
      // 漫反射光照分量
      float diff = max(dot(normal, lightDir), 0.0);// 得到光源对当前片段实际的漫反射影响
      // 镜面光光照分量
      vec3 reflectDir = reflect(-lightDir, normal);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
      // 衰减系数
      float distance = length(light.position - fragPos);
      float attenuation = 1.0 / (light.constant + light.linear * distance +
                          light.quadratic * distance * distance);
      // 从纹理读取颜色分量
      vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords));
      vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));
      vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));
      // 衰减后
      ambient *= attenuation;
      diffuse *= attenuation;
      specular *= attenuation;
      return (ambient + diffuse + specular);
  }
  void main()
  {
      ........
      // 点光源
      for(int i = 0; i < NR_POINT_LIGHTS; i++){
          result += CalcPointLight(pointLights[i], norm, FragPos, viewDir);
      }
      // 聚光灯
      result += CalcSpotLight(spotLight, norm, FragPos, viewDir);
      
      FragColor = vec4(result, 1.0);
  }
  ```

  cpp

  ```cpp
  unsigned int texture3 = loadTexture("assest/textures/spotlightimg.jpg");
  lightingShader.setInt("material.spotLightDiffuse", 2);
  // -----------
  while (!glfwWindowShouldClose(window))
  {
      // 聚光灯
      lightingShader.setVec3("spotLight.ambient", 0.1f, 0.1f, 0.1f);
      lightingShader.setVec3("spotLight.diffuse", 0.8f, 0.8f, 0.8f);
      lightingShader.setVec3("spotLight.specular", 1.0f, 1.0f, 1.0f);
      lightingShader.setVec3("spotLight.position", camera.Position);
      lightingShader.setVec3("spotLight.direction", camera.Front);// direction是光照射方向
      lightingShader.setFloat("spotLight.cutOff", glm::cos(glm::radians(12.5f)));
      lightingShader.setFloat("spotLight.outerCutOff", glm::cos(glm::radians(17.5f)));
  
      lightingShader.setFloat("spotLight.constant", 1.0f);
      lightingShader.setFloat("spotLight.linear", 0.09f);
      lightingShader.setFloat("spotLight.quadratic", 0.032f);
      glActiveTexture(GL_TEXTURE2);
      glBindTexture(GL_TEXTURE_2D, texture3);
  ```

- 效果

  ![](图片/2.6多光源/效果2聚光灯漫反射读取材质颜色作为反射强度.png)




