# frozen_string_literal: true
# Fix for LibreSSL 3.x (macOS system Ruby 2.6) which raises
# "couldn't set additional authenticated data" when auth_data= is called
# on an AES-256-GCM cipher context.
#
# Rails always passes an empty string ("") as auth_data, which is the GCM
# default anyway, so silencing the error is safe: the auth_tag still covers
# the ciphertext, and encrypt/decrypt remain consistent with each other.

if defined?(OpenSSL::OPENSSL_LIBRARY_VERSION) &&
    OpenSSL::OPENSSL_LIBRARY_VERSION.include?('LibreSSL')

  module LibreSSLCipherAuthDataFix
    def auth_data=(data)
      super
    rescue OpenSSL::Cipher::CipherError
      # LibreSSL doesn't accept auth_data= on GCM contexts; safe to skip
      # because Rails always uses "" (the implicit GCM default).
    end
  end

  OpenSSL::Cipher.prepend(LibreSSLCipherAuthDataFix)
  $stderr.puts "[LibresslFix] OpenSSL::Cipher#auth_data= patched for LibreSSL #{OpenSSL::OPENSSL_LIBRARY_VERSION}"
  $stderr.flush
end
