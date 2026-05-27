class TestError < StandardError
end

begin
  raise TestError.new
rescue => e
  puts e.class
  begin
    raise e, 'abc'
  rescue => f
    puts f.class
  end
end
