FROM public.ecr.aws/lambda/nodejs:20

# Copy function code
COPY dist/index.js ./
  
# Set the CMD to your handler
CMD [ "index.handler" ]