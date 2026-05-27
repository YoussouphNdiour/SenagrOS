require 'rjb'
Rjb::load
begin
  Rjb::throw('java.lang.NumberFormatException', 'test')
  Rjb::throw(Rjb::import('java.lang.NumberFormatException').new('test'))
rescue NumberFormatException => e
  puts "I expect a NumberFormatException to be thrown"
rescue Exception => e
  puts "I at least expect *some* excetpion to be thrown"
else
  puts "Unexpectedly no exception is thrown"
end

