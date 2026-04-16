/* CS 305 Lab 1 code */

#include <stdio.h>

/* program to show the sizes of different variable types */
int main(int argv, char* argc[]) {
  int intVar = 10;
  char charVar = 'a';
  double doubleVar = 25.78;
  int * intPointer;
  char * charPointer;
  double * doublePointer;
  unsigned int unsignedVar = 5;

  int s_int = sizeof(intVar);
  int s_char = sizeof(charVar);
  int s_double = sizeof(doubleVar);
  int s_intPointer = sizeof(intPointer);
  int s_charPointer = sizeof(charPointer);
  int s_doublePointer = sizeof(doublePointer);
  int s_unsigned = sizeof(unsignedVar);

  printf("Size of int in bytes: %d\n", s_int);
  printf("Size of char in bytes: %d\n", s_char);
  printf("Size of double in bytes: %d\n", s_double);
  printf("Size of int pointer in bytes: %d\n", s_intPointer);
  printf("Size of char pointer in bytes: %d\n", s_charPointer);
  printf("Size of double pointer in bytes: %d\n", s_doublePointer);
  printf("Size of unsigned integer in bytes: %d\n", s_unsigned);

  /* now assign the pointers */
  intPointer = &intVar;   // this assigns the address of intVar to intPointer
  charPointer = &charVar;
  doublePointer = &doubleVar;

  /* print the values of the variables */
  printf("Value of intVar: %d\n", intVar);
  printf("Value of charVar: %c\n", charVar);
  printf("Value of doubleVar: %lf\n", doubleVar);
  
  /* print the values of the pointers */
  printf("Value of intPointer: %p\n", intPointer);
  printf("Value of charPointer: %p\n", charPointer);
  printf("Value of doublePointer: %p\n", doublePointer);

  return 0;
}
