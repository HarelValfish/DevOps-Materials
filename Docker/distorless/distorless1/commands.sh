docker build -t dummy-payment .

docker run --rm -d -p 3000:3000 --name dummy-payment dummy-payment