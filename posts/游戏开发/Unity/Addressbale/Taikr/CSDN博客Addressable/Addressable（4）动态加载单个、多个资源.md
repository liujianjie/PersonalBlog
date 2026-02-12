# 一、动态加载单个资源

## 知识点一：通过资源名或标签名动态加载单个资源

- 代码

  ```csharp
  AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>("Cube");
  handle.Completed += (handle) =>
  {
      if (handle.Status == AsyncOperationStatus.Succeeded) {
          Instantiate(handle.Result);
      }
      //Addressables.Release(handle);//释放资源
  };
  ```

- 效果

  ![image-20231025202452277](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210017878.png)

- 注意点同名资源

  - 如果存在**同名或同标签的同类型资源**，我们无法确定加载的哪一个，它会自动加载找到的**第一个**满足条件的对象

    - 代码

      ```csharp
      AsyncOperationHandle<GameObject> handle = Addressables.LoadAssetAsync<GameObject>("Cube");
      ```

    - 效果

      ![image-20231025202138571](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210017881.png)

  - 如果存在同名或同标签的不同类型资源，我们可以根据**泛型类型**来决定加载哪一个

## 知识点二：释放资源

- 代码

  ```csharp
  Addressables.Release(handle);
  ```

- 3种模式

  1. Use Asset Database模式下：加载的资源会被缓存，不会被释放

  2. simulate groups: 加载的资源会被缓存，不会被释放

  3. Use Existing Build:加载的资源不会被缓存，会被释放

     ![image-20231025202543495](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210017885.png)

- 注意

  由于LoadAssetAsync代码是异步加载，再卸载之前确保资源已经加载

## 知识点三：动态加载场景

- 代码

  - 自动激活加载场景

    ```csharp
    Addressables.LoadSceneAsync("SampleScene", UnityEngine.SceneManagement.LoadSceneMode.Single, true, 100);
    ```

  - 手动激活场景

    ```csharp
    Addressables.LoadSceneAsync("SampleScene", UnityEngine.SceneManagement.LoadSceneMode.Single, false).Completed +=(obj)=>{
        // 手动激活场景
        obj.Result.ActivateAsync();
    };
    ```

- 卸载

  - 代码

    ```csharp
    Addressables.LoadSceneAsync("SampleScene", UnityEngine.SceneManagement.LoadSceneMode.Single, false).Completed +=(obj)=>{
        // 手动激活场景
        obj.Result.ActivateAsync().completed += (a) =>
        {
            // 会卸载场景中的物体
            Addressables.Release(obj);
        };
    };
    ```

  - 效果

    ![image-20231025203959750](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210019859.png)

# 二、动态加载多个资源

## 知识点一：根据资源名或标签名加载多个对象

- 代码

  ```csharp
          #region 知识点一 根据资源名或标签名加载多个对象
          //加载资源
          //参数一：资源名或标签名
          //参数二：加载结束后的回调函数
          //参数三：如果为true表示当资源加载失败时，会自动将已加载的资源和依赖都释放掉；如果为false，需要自己手动来管理释放
          AsyncOperationHandle<IList<GameObject>> handle = Addressables.LoadAssetsAsync<GameObject>("Cube", (obj) =>
          {
              Debug.Log(obj.name);
          }, true);
          //如果要进行资源释放管理 那么我们需要使用这种方式 要方便一些
          //因为我们得到了返回值对象 就可以释放资源了
          handle.Completed += (obj) =>
          {
              foreach (var item in obj.Result)
              {
                  Debug.Log(item.name);
              }
              //释放资源
              Addressables.Release(handle);
          };
          //注意：我们还是可以通过泛型类型，来筛选资源类型
          #endregion
  ```

- 效果

  ![image-20231030200447836](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210019318.png)

## 知识点二：根据多种信息加载对象

- 代码

  ```csharp
          #region 知识点二 根据多种信息加载对象
          //参数一：想要加载资源的条件列表（资源名、Lable名）
          //参数二：每个加载资源结束后会调用的函数，会把加载到的资源传入该函数中
          //参数三：可寻址的合并模式，用于合并请求结果的选项。
          //如果键（Cube，Red）映射到结果（[1,2,3]，[1,3,4]），数字代表不同的资源
          //None：不发生合并，将使用第一组结果 结果为[1,2,3]
          //UseFirst：应用第一组结果 结果为[1,2,3]
          //Union：合并所有结果 结果为[1,2,3,4]
          //Intersection：使用相交结果 结果为[1,3]
          //参数四：如果为true表示当资源加载失败时，会自动将已加载的资源和依赖都释放掉
          //      如果为false，需要自己手动来管理释放
          List<string> strs = new List<string>() { "Cube", "Red" };
          Addressables.LoadAssetsAsync<Object>(strs, (obj) =>
          {
              Debug.Log(obj.name);
          }, Addressables.MergeMode.Intersection);
          #endregion
  ```

- 效果

  ![image-20231030200318460](https://raw.githubusercontent.com/liujianjie/Image/main/ImgFloder/202311210019325.png)

## 总结

1. 可以根据 **资源名或标签名**+**资源类型** 来加载所有满足条件的对象
2. 可以根据 **资源名**+**标签名**+**资源类型**+**合并模**式 来加载指定的**单个**或者**多个**对象


