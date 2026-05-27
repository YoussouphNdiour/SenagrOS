require 'rjb'
Rjb::load
begin
  Rjb::import('java.lang.Integer').parseInt('x')
rescue NumberFormatException => e
  puts e.class
  puts e.message
  begin
    puts (StandardError === e).to_s
    raise e
  rescue => f
    puts f.class
    puts f.message
    puts f.cause.inspect
    puts f.exception.inspect
    if e.class == f.class
      puts "I expect the equality to be true"
    else
      puts "Unexpectedly the re-raised Java exception has changed " +
           "from a #{e.class} into a #{f.class}"
    end
  end
end
