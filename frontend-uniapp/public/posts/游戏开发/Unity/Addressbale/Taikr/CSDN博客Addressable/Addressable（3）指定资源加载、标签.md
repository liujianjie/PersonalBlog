# 一、指定资源加载

## 资源准备

![image-20231017220524408](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210011115.png)

## Addressables中的资源标识类

```c#
        //AssetReference                通用资源标识类 可以用来加载任意类型资源
        //AssetReferenceAtlasedSprite   图集资源标识类
        //AssetReferenceGameObject      游戏对象资源标识类
        //AssetReferenceSprite          精灵图片资源标识类
        //AssetReferenceTexture         贴图资源标识类
        //AssetReferenceTexture2D
        //AssetReferenceTexture3D
        //AssetReferenceT<>             指定类型标识类
```

## 加载资源

- 代码

  ```c#
  using UnityEngine.AddressableAssets;
  using UnityEngine.ResourceManagement.AsyncOperations;
  void Start(){
      // assetReference是指定资源
      assetReference.LoadAssetAsync<GameObject>().Completed += (handle) =>
          {
              //使用传入的参数（建议）
              //判断是否加载成功
              if (handle.Status == AsyncOperationStatus.Succeeded)
              {
                  GameObject cube = Instantiate(handle.Result);
                  //一定资源加载过后 使用完后 再去释放
                  assetReference.ReleaseAsset();
  
                  materialRed.LoadAssetAsync().Completed += (obj) =>
                  {
                      cube.GetComponent<MeshRenderer>().material = obj.Result;
                      //这样会造成使用这个资源的对象 资源丢失
                      materialRed.ReleaseAsset();
  
                      //这个异步加载传入对象的资源
                      print(obj.Result);
                      //这个是 资源标识类的资源
                      print(materialRed.Asset);
                  };
              }
             
              //使用标识类创建
              //if(assetReference.IsDone)
              //{
              //    Instantiate(assetReference.Asset);
              //}
          };
  
          audioReference.LoadAssetAsync().Completed += (handle) =>
          {
              //使用音效
          };
      
  }
      private void TestFun(AsyncOperationHandle<GameObject> handle)
      {
          //加载成功后 使用加载的资源嘛
          //判断是否加载成功
          if(handle.Status == AsyncOperationStatus.Succeeded)
          {
              Instantiate(handle.Result);
          }
      }
  
  ```

- 小解

  - 异步加载

  - 根据传入的参数，判断加载成功与否

    ```c#
    if (handle.Status == AsyncOperationStatus.Succeeded)
    ```

  - 根据标志，判断加载成功与否

    ```c#
    if(assetReference.IsDone)
    ```




# 二、标签

## 知识点一：标签简介

为了动态加载

## 知识点二：添加标签

![image-20231025125800082](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210016115.png)

## 知识点三：标签的作用

1. 游戏装备中有一顶帽子：Hat

   根据标签赋予不同的材质：红、绿、白

2. 根据设备好坏来选择不同质量的图片或者模型

   根据设备的不同，加载不同质量的东西

   不过一个模型可能会存多份

3. 在逢年过节时更换游戏中模型和UI的显示

   根据标签加载不同的UI

## 知识点四：通过标签相关特性约束标识类对象

- 代码

  ```c#
  public class Lesson4 : MonoBehaviour
  {
      [AssetReferenceUILabelRestriction("SD", "HD")]// 约束
      public AssetReference assetReference;
  ```

- 效果

  ![image-20231025130703912](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210013202.png)


## 小结

- **相同作用**的**不同资源**（模型、贴图、材质、UI等等）
  我们可以让他们的资源名相同
  通过标签**Label**区分他们来加载使用

- 加载资源

  利用名字和标签可以**单独动态**加载某个资源
  也可以利用它们**共同决定**加载哪个资源
