#include <iostream>
#include <cmath>

using namespace std;

int main()
{
	int a, b;
	cin >> a >> b;
	char operation;
	cin >> operation;

	int result;
	if (operation == '+')
		result = a + b;
	else if (operation == '-')
		result = a - b;
	else if (operation == '*')
		result = a * b;
	else if (operation == '/')
	{
		result = (b != 0) ? (a / b) : (pow(2, 31));
	}
// 11111111  11111111 11111111 11111111
	cout << result << endl;
}
