using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using server.Entities;

namespace server.Data;

public partial class MyDbContext : DbContext
{
    public MyDbContext(DbContextOptions<MyDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<message> messages { get; set; }

    public virtual DbSet<room> rooms { get; set; }

    public virtual DbSet<user> users { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<message>(entity =>
        {
            entity.HasKey(e => e.id).HasName("messages_pkey");

            entity.HasIndex(e => new { e.room_id, e.created_at }, "ix_messages_room_id_created_at");

            entity.HasIndex(e => e.user_id, "ix_messages_user_id");

            entity.HasOne(d => d.room).WithMany(p => p.messages)
                .HasForeignKey(d => d.room_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_messages_room");

            entity.HasOne(d => d.user).WithMany(p => p.messages)
                .HasForeignKey(d => d.user_id)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("fk_messages_user");
        });

        modelBuilder.Entity<room>(entity =>
        {
            entity.HasKey(e => e.id).HasName("rooms_pkey");
        });

        modelBuilder.Entity<user>(entity =>
        {
            entity.HasKey(e => e.id).HasName("users_pkey");

            entity.HasMany(d => d.rooms).WithMany(p => p.users)
                .UsingEntity<Dictionary<string, object>>(
                    "user_room",
                    r => r.HasOne<room>().WithMany()
                        .HasForeignKey("room_id")
                        .HasConstraintName("fk_user_rooms_room"),
                    l => l.HasOne<user>().WithMany()
                        .HasForeignKey("user_id")
                        .HasConstraintName("fk_user_rooms_user"),
                    j =>
                    {
                        j.HasKey("user_id", "room_id").HasName("user_rooms_pkey");
                        j.ToTable("user_rooms");
                        j.HasIndex(new[] { "room_id" }, "ix_user_rooms_room_id");
                    });
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
