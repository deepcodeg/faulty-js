import java.security.*;

class Test {
  int value;

  int compare(Test o) {
    if (o.value > value) return 1;
    return 0;
  }
}

