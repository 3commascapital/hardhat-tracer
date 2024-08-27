contract OpCodes {
  uint256 internal constant maxUint256 = type(uint256).max;
  int256 internal constant maxInt256 = type(int256).max;
  uint8 internal constant maxUint8 = type(uint8).max;
  int8 internal constant maxInt8 = type(int8).max;
  uint256 internal constant minUint256 = type(uint256).min;
  int256 internal constant minInt256 = type(int256).min;
  uint8 internal constant minUint8 = type(uint8).min;
  int8 internal constant minInt8 = type(int8).min;

  error MathError();

  uint256 internal constant ZERO = 0;
  uint256 internal constant ONE = 1;
  uint256 internal constant TWO = 2;
  uint256 internal constant THREE = 3;
  uint256 internal constant FOUR = 4;

  function _iterateInt256(
    uint256 limit,
    int256[] calldata list,
    function(int256[] calldata) internal pure returns (bool) fn
  ) internal pure {
    unchecked {
      uint256 i;
      uint256 len = list.length / limit;
      uint256 a;
      do {
        a = i * limit;
        if (!fn(list[a:a + limit])) {
          revert MathError();
        }
        ++i;
      } while (i < len);
    }
  }

  function _iterateUint256(
    uint256 limit,
    uint256[] calldata list,
    function(uint256[] calldata) internal pure returns (bool) fn
  ) internal pure {
    unchecked {
      uint256 i;
      uint256 len = list.length / limit;
      uint256 a;
      do {
        a = i * limit;
        if (!fn(list[a:a + limit])) {
          revert MathError();
        }
        ++i;
      } while (i < len);
    }
  }

  function addInt256(int256[] calldata inputs) external pure {
    _iterateInt256(THREE, inputs, _add);
  }

  function _add(int256[] calldata inputs) internal pure returns (bool) {
    unchecked {
      return (inputs[ZERO] + inputs[ONE]) == inputs[TWO];
    }
  }

  function subInt256(int256[] calldata inputs) external pure {
    _iterateInt256(THREE, inputs, _sub);
  }

  function _sub(int256[] calldata inputs) internal pure returns (bool) {
    unchecked {
      return (inputs[ZERO] - inputs[ONE]) == inputs[TWO];
    }
  }

  function mulInt256(int256[] calldata inputs) external pure {
    _iterateInt256(THREE, inputs, _mul);
  }

  function _mul(int256[] calldata inputs) internal pure returns (bool) {
    unchecked {
      return (inputs[ZERO] * inputs[ONE]) == inputs[TWO];
    }
  }

  function divInt256(int256[] calldata inputs) external pure {
    _iterateInt256(THREE, inputs, _div);
  }

  function _div(int256[] calldata inputs) internal pure returns (bool) {
    unchecked {
      return (inputs[ZERO] / inputs[ONE]) == inputs[TWO];
    }
  }

  function divUint256(uint256[] calldata inputs) external pure {
    _iterateUint256(THREE, inputs, _divUint);
  }

  function _divUint(uint256[] calldata inputs) internal pure returns (bool) {
    unchecked {
      return (inputs[ZERO] / inputs[ONE]) == inputs[TWO];
    }
  }
}
