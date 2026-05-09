- 数组

  ```cpp
  vec2 offsets[9] = vec2[](
      vec2(-offset,  offset), // 左上
      vec2( 0.0f,    offset), // 正上
      vec2( offset,  offset), // 右上
      vec2(-offset,  0.0f),   // 左
      vec2( 0.0f,    0.0f),   // 中
      vec2( offset,  0.0f),   // 右
      vec2(-offset, -offset), // 左下
      vec2( 0.0f,   -offset), // 正下
      vec2( offset, -offset)  // 右下
  );
  ```

  ```cpp
  float kernel[9] = float[](
      -1, -1, -1,
      -1,  9, -1,
      -1, -1, -1
  );
  ```

  
