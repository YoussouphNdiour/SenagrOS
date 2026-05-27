begin
  i.foo
rescue => e
  puts e.class
  begin
    raise e
  rescue => f
    puts f.class
  end
end
