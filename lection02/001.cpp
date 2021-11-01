#include <iostream>
#include <vector>

int main()
{
	// комментарий к коду
	std::cout << "Testing git" << std::endl;
	double meas;
	/*
	int N;
	std::cin >> N;	
	double arr[N];
	arr[0] = 1.125;
	arr[1] = 1.125;
	arr[2] = 1.125;
	*/
	std::vector<double> vec;
	vec.push_back(1.125);	
	vec.push_back(2.125);	
	vec.push_back(3.125);	

	for (int i = 0; i < vec.size(); ++i)
	{
		std::cout << vec[i] << " ";
	}

	return 0;
}
