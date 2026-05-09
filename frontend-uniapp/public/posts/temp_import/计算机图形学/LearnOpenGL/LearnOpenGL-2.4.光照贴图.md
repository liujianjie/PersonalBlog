# 光照贴图

- 上一节手动设置材质的缺点
  - 不能对一个物体的视觉输出提供足够多的灵活性。
  - 将整个物体的材质定义为一个整体，但现实世界中的物体通常并不只包含有一种材质，而是由多种材质所组成

所以我们需要拓展之前的系统，引入**漫反射**和**镜面光**贴图(Map)。这允许我们对物体的漫反射分量（以及间接地对环境光分量，它们几乎总是一样的）和镜面光分量有着更精确的控制。

# 漫反射贴图

- 纹理作用

  能够让我们根据**片段**在物体上的位置来获取颜色值，让我们能够逐片段索引其独立的颜色值

- 纹理变为漫反射贴图

  在光照场景中，纹理通常叫做一个漫反射贴图(Diffuse Map)（3D艺术家通常都这么叫它），它是一个表现了物体所有的漫反射颜色的纹理图像。

## 例子1

glsl

```cpp
#version 330 core
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;
in vec2 TexCoords;// 纹理坐标

uniform vec3 viewPos;

struct Material {
    sampler2D diffuse;	// 纹理单元
    vec3 specular;		// 镜面光照颜色分量依旧是手动设置
    float shininess;
}; 
uniform Material material;

// 光照强度
struct Light {
    vec3 position;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

uniform Light light;
void main()
{
    // 环境光照分量
    float ambientStrength = 0.1;
    // 从漫反射纹理读取颜色分量
    vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords));

    // 漫反射光照分量
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(light.position - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);                              // 得到光源对当前片段实际的漫反射影响
    vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));// 从漫反射纹理读取颜色分量

    // 镜面光照分量
    float specularStrength = 0.5;
    vec3 viewDir = normalize(viewPos - FragPos);                            // 是观察者方向，不是观察者看向的方向
    vec3 reflectDir = reflect(-lightDir, norm);

    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);// 光源对当前片段的镜面光影响
    vec3 specular = light.specular * (spec * material.specular);            // 手动设置的镜面光照颜色分量

    vec3 result = (ambient + diffuse + specular) ;
    
    FragColor = vec4(result, 1.0);
}
```

- 可见

  依旧是冯氏光照模型

  - 镜面光照的颜色分量是手动设置的

  - 而漫反射光照的颜色分量是读取纹理

    vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));

    **漫反射光照分量 = 光源漫反射颜色分量 * 对当前片段采样漫反射纹理颜色 * 光源对片段的漫反射影响**

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
    Normal = aNormal;
    TexCoords = aTexCoords;
}
```

cpp

要更新顶点数据（坐标、法线、纹理），要重新设置顶点属性指针，要加载纹理

```cpp
 // position attribute
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)0);
glEnableVertexAttribArray(0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(3 * sizeof(float)));
glEnableVertexAttribArray(1);
glVertexAttribPointer(2, 3, GL_FLOAT, GL_FALSE, 8 * sizeof(float), (void*)(6 * sizeof(float)));
glEnableVertexAttribArray(2);

// load and create a texture 
// -------------------------
unsigned int texture1 = loadTexture("assest/textures/container2.png");
// 纹理加载出过错，由于图片是rgba格式，没有自动读取格式，而是硬编码设置了rgb，所以导致错误

// 设置使用的纹理单元
lightingShader.use();
lightingShader.setInt("material.diffuse", 0);

// 绘制前绑定漫反射贴图-出过错，放在绘制光源cube那里
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, texture1);

// render the cube
glBindVertexArray(cubeVAO);
glDrawArrays(GL_TRIANGLES, 0, 36);

// 根据图片的通道不同，设置加载图像的参数
unsigned int loadTexture(char const* path)
{
    unsigned int textureID;
    glGenTextures(1, &textureID);

    int width, height, nrComponents;
    unsigned char* data = stbi_load(path, &width, &height, &nrComponents, 0);
    if (data)
    {
        GLenum format;
        if (nrComponents == 1)
            format = GL_RED;
        else if (nrComponents == 3)
            format = GL_RGB;
        else if (nrComponents == 4)
            format = GL_RGBA;

        glBindTexture(GL_TEXTURE_2D, textureID);
        glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);
        glGenerateMipmap(GL_TEXTURE_2D);

        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

        stbi_image_free(data);
    }
    else
    {
        std::cout << "Texture failed to load at path: " << path << std::endl;
        stbi_image_free(data);
    }
    return textureID;
}
```

![materials_diffuse_map](图片/2.4光照贴图/materials_diffuse_map.png)



# 镜面光贴图

- 例子1效果的不足

  如例子1的效果，木头不应该这么强的镜面光。

- 不足原因

  因为我们手动设置的镜面光强度，适用于整个物体，整个物体的镜面光颜色分量都**一样**

- 需要镜面光贴图解决

  引入镜面光贴图，将木头部分的颜色为**黑色**，glsl读取时会变成0，即：没有镜面光

  而四周金属部分保持**原样**，glsl读取时会大于0，即：具有镜面光

  ![](图片/2.4光照贴图/container2_specular.png)

## 例子2 采样镜面光贴图

相比例子1

- cpp

  增加了一个纹理，并设置它的纹理单元

- glsl

  镜面光不再是手动指定整个物体都是同一个颜色分量，而是读取材质的颜色作为颜色分量

  ```cpp
  #version 330 core
  out vec4 FragColor;
  
  in vec3 Normal;
  in vec3 FragPos;
  in vec2 TexCoords;// 纹理坐标
  
  uniform vec3 viewPos;
  
  struct Material {
      sampler2D diffuse;// 纹理单元
      //vec3 specular;    // 镜面光照颜色分量依旧是手动设置
      sampler2D specular;//  镜面光照颜色分量从纹理采样
      float shininess;
  }; 
  uniform Material material;
  
  // 光照强度
  struct Light {
      vec3 position;
  
      vec3 ambient;
      vec3 diffuse;
      vec3 specular;
  };
  
  uniform Light light;
  void main()
  {
      // 环境光照分量
      float ambientStrength = 0.1;
      // 从漫反射纹理读取颜色分量
      vec3 ambient = light.ambient * vec3(texture(material.diffuse, TexCoords)); 
  
      // 漫反射光照分量
      vec3 norm = normalize(Normal);
      vec3 lightDir = normalize(light.position - FragPos);
      float diff = max(dot(norm, lightDir), 0.0);                 // 得到光源对当前片段实际的漫反射影响
      vec3 diffuse = light.diffuse * diff * vec3(texture(material.diffuse, TexCoords));// 从漫反射纹理读取颜色分量
  
      // 镜面光照分量
      float specularStrength = 0.5;
      vec3 viewDir = normalize(viewPos - FragPos); // 是观察者方向，不是观察者看向的方向
      vec3 reflectDir = reflect(-lightDir, norm);
  
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);// 光源对当前片段的镜面光影响
      // vec3 specular = light.specular * (spec * material.specular); // 改变在这里
      // 采样镜面光纹理颜色作为镜面光照颜色分量
      vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords)); 
  
      vec3 result = (ambient + diffuse + specular) ;
      
      FragColor = vec4(result, 1.0);
  }
  ```
  
- 效果

  ![](图片/2.4光照贴图/materials_specular_map.png)

# 小结

## 什么是光照贴图

- 上节

  ```cpp
  lightingShader.setVec3("material.ambient", 1.0f, 0.5f, 0.31f);
  lightingShader.setVec3("material.diffuse", 1.0f, 0.5f, 0.31f);
  lightingShader.setVec3("material.specular", 0.5f, 0.5f, 0.5f);
  lightingShader.setFloat("material.shininess", 32.0f);
  ```

  手动定义了物体的材质，即设置了环境光、漫反射光、镜面光照颜色分量

- 而这节用光照贴图

  代替手动定义材质，从光照贴图中读取三种光照的颜色分量。

  光照贴图等同纹理，只不过在**光照场景**下，纹理被称为光照贴图。

- 光照贴图包含

  - 漫反射贴图
  - 镜面光贴图

## 光照贴图如何影响颜色

- 漫反射贴图

  根据各个**片段的uv**读取漫反射贴图上的颜色值，然后作为漫反射、环境光照颜色分量，乘以2.2节光源对片段的漫反射影响再乘以光源颜色分量。

- 镜面光贴图

  根据各个**片段的uv**读取镜面光贴图上的颜色值，然后作为镜面光颜色分量，乘以2.2节光源对片段的镜面光影响再乘以光源颜色分量。

